import asyncio
from typing import Any, Dict
import aiohttp


class OCRSpaceService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.ocr.space/parse/image"
        self.timeout = 30
        
    async def extract_text(self, image_bytes: bytes, filename: str) -> Dict[str, Any]:
        try:
            async with aiohttp.ClientSession() as session:
                data = aiohttp.FormData()
                data.add_field('file', 
                             image_bytes, 
                             filename=filename,
                             content_type='image/png')
                
                data.add_field('apikey', self.api_key)
                data.add_field('language', 'spa')
                data.add_field('isOverlayRequired', 'false')
                data.add_field('isTable', 'true')
                data.add_field('scale', 'true')
                data.add_field('OCREngine', '2')  
                async with session.post(
                    self.base_url,
                    data=data,
                    timeout=aiohttp.ClientTimeout(total=self.timeout)
                ) as response:
                    
                    if response.status != 200:
                        return {
                            "success": False,
                            "error": f"Error en API OCR: {response.status}",
                            "text": "",
                            "word_count": 0,
                            "confidence": 0.0
                        }
                    
                    result = await response.json()
                    if result.get("IsErroredOnProcessing", True):
                        return {
                            "success": False,
                            "error": result.get("ErrorMessage", "Error desconocido en OCR"),
                            "text": "",
                            "word_count": 0,
                            "confidence": 0.0
                        }
                    
                    parsed_results = result.get("ParsedResults", [])
                    if not parsed_results:
                        return {
                            "success": False,
                            "error": "No se obtuvieron resultados del OCR",
                            "text": "",
                            "word_count": 0,
                            "confidence": 0.0
                        }
                    parsed_result = parsed_results[0]
                    extracted_text = parsed_result.get("ParsedText", "").strip()
                    text_overlay = parsed_result.get("TextOverlay", {})
                    word_count = len(extracted_text.split())
                    confidence = self._calculate_confidence(text_overlay)
                    
                    return {
                        "success": True,
                        "text": extracted_text,
                        "word_count": word_count,
                        "confidence": confidence,
                        "raw_response": result
                    }
                    
        except asyncio.TimeoutError:
            return {
                "success": False,
                "error": "Timeout en OCR Space",
                "text": "",
                "word_count": 0,
                "confidence": 0.0
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error en OCR: {str(e)}",
                "text": "",
                "word_count": 0,
                "confidence": 0.0
            }
    
    def _calculate_confidence(self, text_overlay: Dict) -> float:
        try:
            lines = text_overlay.get("Lines", [])
            if not lines:
                return 0.0
                
            total_confidence = 0.0
            word_count = 0
            
            for line in lines:
                words = line.get("Words", [])
                for word in words:
                    confidence = word.get("WordConfidence", 0)
                    total_confidence += confidence
                    word_count += 1
            
            return total_confidence / word_count if word_count > 0 else 0.0
            
        except Exception:
            return 0.0