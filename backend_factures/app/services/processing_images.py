from datetime import datetime
import os
import uuid
from fastapi import UploadFile, HTTPException, status
from typing import List, Dict, Any, Optional, Tuple
import magic
import cv2
import numpy as np
from PIL import Image
import io
import base64
import asyncio
from app.services.file_manager_service import FileManagerService
from app.services.ocr_space import OCRSpaceService
from app.services.processing_text import AITextProcessorService

class ImageProcessorService:
    def __init__(self):
        self.allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp']
        self.max_file_size = 50 * 1024 * 1024 
        self.enhanced_dir = "temp"
        os.makedirs(self.enhanced_dir, exist_ok=True)
        self.ocr_service = OCRSpaceService("K87033164188957")
    async def process_images(
        self, 
        files: List[UploadFile],
        enhance_ocr: bool = True,
        process_in_parallel: bool = True,
        base_api_url : str = "",
        limit_thinking_ai : int = 2
    ) -> Dict[str, Any]:
        validated_files = await self._validate_files(files)
        if process_in_parallel:
            results = await self._process_parallel(validated_files, enhance_ocr,base_api_url,limit_thinking_ai)
        else:
            results = await self._process_sequential(validated_files, enhance_ocr,base_api_url,limit_thinking_ai)
        return self._format_results(results)
    async def _validate_files(self, files: List[UploadFile]) -> List[Dict[str, Any]]:
        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se recibieron archivos"
            )
        validated_files = []
        for file in files:
            file_content = await file.read(2048)
            await file.seek(0)
            mime_type = magic.from_buffer(file_content, mime=True)
            if mime_type not in self.allowed_types:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=f"Tipo de archivo no soportado: {mime_type}"
                )
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)
            if file_size > self.max_file_size:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Archivo {file.filename} demasiado grande"
                )
            try:
                image = Image.open(io.BytesIO(file_content))
                image.verify()
                await file.seek(0)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Imagen corrupta: {file.filename}"
                )
            validated_files.append({
                "file": file,
                "filename": file.filename,
                "mime_type": mime_type
            })
        return validated_files

    async def _process_parallel(
        self, 
        validated_files: List[Dict[str, Any]], 
        enhance_ocr: bool,
        base_api_url : str = "",
        limit_thinking_ai : int = 2
    ) -> List[Dict[str, Any]]:
        tasks = [
            self._process_single_image(file_data, enhance_ocr,base_api_url,limit_thinking_ai) 
            for file_data in validated_files
        ]
        return await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _process_sequential(
        self, 
        validated_files: List[Dict[str, Any]], 
        enhance_ocr: bool,
        base_api_url : str = "",
        limit_thinking_ai : int = 2
    ) -> List[Dict[str, Any]]:
        results = []
        for file_data in validated_files:
            try:
                result = await self._process_single_image(file_data, enhance_ocr,base_api_url,limit_thinking_ai)
                results.append(result)
            except Exception as e:
                results.append({
                    "filename": file_data["filename"],
                    "success": False,
                    "error": str(e)
                })
        return results
        
    async def _process_single_image(
        self, 
        file_data: Dict[str, Any], 
        enhance_ocr: bool,
        base_api_url : str = "",
        limit_thinking_ai : int = 2
    ) -> Dict[str, Any]:
        start_time = datetime.now()
        try:
            image_bytes = await file_data["file"].read()
            original_ocr = await self.ocr_service.extract_text(image_bytes, file_data["filename"])
            enhanced_ocr = None
            enhanced_image_path = ""
            enhanced_bytes = None
            if enhance_ocr:
                enhanced_bytes = await self._enhance_image_quality(
                    image_bytes, file_data["filename"]
                )
                enhanced_ocr = await self.ocr_service.extract_text(enhanced_bytes, f"enhanced_{file_data['filename']}")
            best_ocr = self._select_best_ocr_result(original_ocr, enhanced_ocr)
            processing_time = (datetime.now() - start_time).total_seconds()
            text_processor = AITextProcessorService()
            invoice_type , structured_data = text_processor.process_extracted_text(best_ocr["text"],limit_thinking_ai)
            file_manager = FileManagerService()
            if structured_data:
                organizacion_result = file_manager.organize_invoice(
                    data=structured_data,
                    original_image= image_bytes, 
                    enhanced_image=enhanced_bytes,
                    data_crud=best_ocr["text"],
                    type_organization = invoice_type

                )
            else:
                organizacion_result = {"success": False, "error": "No structured data"}
            return {
                "filename": file_data["filename"],
                "success": True,
                "data_crud" : best_ocr["text"],
                "type_model" : invoice_type,
                "data_text": structured_data.dict() if structured_data else None,
                "path_json_text": str(base_api_url) + organizacion_result["archivos_guardados"][0],
                "path_original_image": str(base_api_url) + organizacion_result["archivos_guardados"][1],
                "path_enhanced_image": str(base_api_url) + organizacion_result["archivos_guardados"][2],
                "confidence": best_ocr["confidence"],
                "word_count": best_ocr["word_count"],
                "processing_time": processing_time,
                "ocr_source": best_ocr["source"],
                "enhanced_image_path": enhanced_image_path if best_ocr["source"] == "enhanced" else "",
                "comparison": {
                    "original": {
                        "word_count": original_ocr.get("word_count", 0),
                        "confidence": original_ocr.get("confidence", 0.0),
                        "success": original_ocr.get("success", False)
                    },
                    "enhanced": {
                        "word_count": enhanced_ocr.get("word_count", 0) if enhanced_ocr else 0,
                        "confidence": enhanced_ocr.get("confidence", 0.0) if enhanced_ocr else 0.0,
                        "success": enhanced_ocr.get("success", False) if enhanced_ocr else False
                    } if enhance_ocr else None
                }
            }
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            return {
                "filename": file_data["filename"],
                "success": False,
                "error": str(e),
                "confidence": 0.0,
                "word_count": 0,
                "processing_time": processing_time,
                "extracted_text": "",
                "ocr_source": "none"
            }

    def _select_best_ocr_result(self, original_ocr: Dict, enhanced_ocr: Optional[Dict]) -> Dict:
        if not enhanced_ocr or not enhanced_ocr.get("success", False):
            return {
                "text": original_ocr.get("text", ""),
                "confidence": original_ocr.get("confidence", 0.0),
                "word_count": original_ocr.get("word_count", 0),
                "source": "original"
            }
        if not original_ocr.get("success", False):
            return {
                "text": enhanced_ocr.get("text", ""),
                "confidence": enhanced_ocr.get("confidence", 0.0),
                "word_count": enhanced_ocr.get("word_count", 0),
                "source": "enhanced"
            }
        original_word_count = original_ocr.get("word_count", 0)
        enhanced_word_count = enhanced_ocr.get("word_count", 0)
        original_confidence = original_ocr.get("confidence", 0.0)
        enhanced_confidence = enhanced_ocr.get("confidence", 0.0)
        word_count_threshold = 3  
        if abs(enhanced_word_count - original_word_count) > word_count_threshold:
            if enhanced_word_count > original_word_count:
                return {
                    "text": enhanced_ocr.get("text", ""),
                    "confidence": enhanced_confidence,
                    "word_count": enhanced_word_count,
                    "source": "enhanced"
                }
            else:
                return {
                    "text": original_ocr.get("text", ""),
                    "confidence": original_confidence,
                    "word_count": original_word_count,
                    "source": "original"
                }
        if enhanced_confidence > original_confidence:
            return {
                "text": enhanced_ocr.get("text", ""),
                "confidence": enhanced_confidence,
                "word_count": enhanced_word_count,
                "source": "enhanced"
            }
        else:
            return {
                "text": original_ocr.get("text", ""),
                "confidence": original_confidence,
                "word_count": original_word_count,
                "source": "original"
            }
    
    async def _enhance_image_quality(self, image_bytes: bytes, original_filename: str) -> bytes:
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return image_bytes, ""
                
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            large_black_rectangles = self._detect_large_black_rectangles(gray)
            
            image_analysis = self._analyze_image_for_binarization(gray)
            if image_analysis['needs_high_precision']:
                binary = cv2.adaptiveThreshold(
                    gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                    cv2.THRESH_BINARY, 13, 10
                )
                background_threshold = 120
            else:
                binary = cv2.adaptiveThreshold(
                    gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                    cv2.THRESH_BINARY, 17, 14
                )
                background_threshold = 130
            
            if np.sum(binary == 0) > np.sum(binary == 255):
                binary = cv2.bitwise_not(binary)
                
            _, background_mask = cv2.threshold(gray, background_threshold, 255, cv2.THRESH_BINARY)
            final = binary.copy()
            safe_background = cv2.bitwise_and(background_mask, cv2.bitwise_not(large_black_rectangles))
            final[safe_background == 255] = 255
            success, encoded_image = cv2.imencode('.png', final)
            if success:
                return encoded_image.tobytes()
            else:
                return image_bytes, ""
                
        except Exception as e:
            print(f"❌ Error en mejora de imagen: {str(e)}")
            return image_bytes, ""

    def _detect_large_black_rectangles(self, gray_image: np.ndarray, min_area: int = 5000) -> np.ndarray:
        try:
            _, black_areas = cv2.threshold(gray_image, 80, 255, cv2.THRESH_BINARY_INV)
            kernel_close = np.ones((7, 7), np.uint8)
            closed_black = cv2.morphologyEx(black_areas, cv2.MORPH_CLOSE, kernel_close)
            kernel_dilate = np.ones((5, 5), np.uint8)
            dilated_black = cv2.dilate(closed_black, kernel_dilate, iterations=2)
            contours, _ = cv2.findContours(dilated_black, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            large_rectangles_mask = np.zeros_like(gray_image, dtype=np.uint8)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                
                if area > min_area:
                    x, y, w, h = cv2.boundingRect(contour)
                    aspect_ratio = w / h if w > h else h / w
                    if aspect_ratio < 8: 
                        cv2.rectangle(large_rectangles_mask, (x, y), (x + w, y + h), 255, -1)
            kernel_final = np.ones((10, 10), np.uint8)
            large_rectangles_mask = cv2.dilate(large_rectangles_mask, kernel_final, iterations=1)
            return large_rectangles_mask
            
        except Exception as e:
            print(f"Error en detección de rectángulos: {e}")
            return np.zeros_like(gray_image, dtype=np.uint8)

    def _analyze_image_for_binarization(self, gray_image: np.ndarray) -> dict:
        mean_intensity = np.mean(gray_image)
        std_intensity = np.std(gray_image)
        grad_x = cv2.Sobel(gray_image, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray_image, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        text_fineness = np.mean(gradient_magnitude) / 255.0
        needs_high_precision = text_fineness > 0.15 
        is_dark_image = mean_intensity < 100
        
        return {
            'mean_intensity': mean_intensity,
            'contrast': std_intensity / 255.0,
            'text_fineness': text_fineness,
            'needs_high_precision': needs_high_precision,
            'is_dark_image': is_dark_image
        }
        
    def _format_results(self, results: List[Any]) -> Dict[str, Any]:
        successful = []
        failed = []
        for result in results:
            if isinstance(result, Exception):
                failed.append({"error": str(result)})
            elif result.get("success"):
                successful.append(result)
            else:
                failed.append(result)
        total_words = sum(r.get("word_count", 0) for r in successful)
        avg_confidence = np.mean([r.get("confidence", 0) for r in successful]) if successful else 0
        enhanced_selected = sum(1 for r in successful if r.get("ocr_source") == "enhanced")
        return {
            "total_processed": len(results),
            "successful_count": len(successful),
            "failed_count": len(failed),
            "total_words_extracted": total_words,
            "average_confidence": round(avg_confidence, 3),
            "enhanced_selected_count": enhanced_selected,
            "original_selected_count": len(successful) - enhanced_selected,
            "successful_results": successful,
            "failed_results": failed
        }
    async def cleanup(self):
        if hasattr(self, 'ai_service'):
            self.ai_service.cleanup()

    
    