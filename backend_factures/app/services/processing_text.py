import re
import json
import requests
from decimal import Decimal
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple, Union
from app.models.model_recibe_facture import FactureWeekend

class AITextProcessorService:
    def __init__(self, ollama_base_url: str = "http://localhost:11434"):
        self.ollama_base_url = ollama_base_url
        self.model_name = "qwen2.5vl:3b"

    def process_extracted_text(self, text: str,limit_learning_examples: int = 2) -> Tuple[str,str]:
        if not text or len(text.strip()) == 0:
            return None
        try:
            invoice_type = self._detect_invoice_type(text)
            if invoice_type == "facture_weekend":
                from app.utils.facture_weekend_processor import process_facture_weekend_invoice
                structured_data = process_facture_weekend_invoice(text, self.ollama_base_url, self.model_name)
                return invoice_type, structured_data
            elif invoice_type == "facture_trip":
                from app.utils.facture_trip_processor import process_facture_trip_invoice
                structured_data = process_facture_trip_invoice(text, self.ollama_base_url, self.model_name) 
                return invoice_type, structured_data
            else:
                print(f"❌ Tipo de factura no soportado: {invoice_type}")
                return None
        except Exception as e:
            print(f"❌ Error crítico en el proceso con IA: {e}")
            return None

    def _detect_invoice_type(self, text: str) -> str:
        text_lower = text.lower()
        patterns = {
            "facture_weekend": {
                "rfc_emisor": [r'rfc\s*emisor', r'emisor\s*rfc', r'rfc'],
                "folio_fiscal": [r'folio\s*fiscal', r'uuid', r'folio'],
                "cfdi": [r'cfdi', r'comprobante'],
                "conceptos": [r'conceptos?', r'descripcion'],
                "nombre_receptor": [r'nombre\s*receptor', r'receptor'],
                "rfc_receptor": [r'rfc\s*receptor', r'receptor\s*rfc'],
                "metodo_pago": [r'metodo\s*pago', r'forma\s*pago'],
                "moneda": [r'moneda', r'divisa']
            },
            "facture_trip": {
                "clave": [r'(?i)clave'],
                "peso_bruto": [r'(?i)peso\s*bruto', r'(?i)bruto'],
                "peso_tara": [r'(?i)peso\s*tara', r'(?i)tara'],
                "tipo_material": [r'(?i)tipo\s*material', r'(?i)material'],
                "recibido": [r'(?i)recibido'],
                "pacas": [r'(?i)pacas'],
                "tipo_documento": [r'(?i)tipo\s*documento', r'(?i)documento'],
                "placas": [r'(?i)placas'],
                "salida": [r'(?i)salida'],
                "tipo_movimiento": [r'(?i)tipo\s*movimiento', r'(?i)movimiento'],
                "porcentaje_no_aptos": [r'(?i)%\s*no\s*aptos', r'(?i)no\s*aptos', r'(?i)porcentaje'],
                "peso_neto": [r'(?i)peso\s*neto', r'(?i)neto'],
                "humedad": [r'(?i)humedad']
            }
        }
        scores = {}
        for invoice_type, type_patterns in patterns.items():
            score = 0
            for pattern in type_patterns:
                if re.search(pattern, text_lower):
                    score += 1
            scores[invoice_type] = score

        print(f"🔍 Scores de detección: {scores}")
        detected_type = max(scores, key=scores.get)
        if scores[detected_type] == 0:
            return "facture_weekend"
            
        return detected_type

    def process_specific_invoice_type(self, text: str, invoice_type: str) -> Tuple[str,str]:
        try:
            if invoice_type == "facture_weekend":
                from app.utils.facture_weekend_processor import process_facture_weekend_invoice
                structured_data = process_facture_weekend_invoice(text, self.ollama_base_url, self.model_name)
                return invoice_type, structured_data
            
            # elif invoice_type == "services":
            #     from app.utils.invoice_processors.services_processor import process_services_invoice
            #     return process_services_invoice(text, self.ollama_base_url, self.model_name)
            
            # elif invoice_type == "products":
            #     from app.utils.invoice_processors.products_processor import process_products_invoice
            #     return process_products_invoice(text, self.ollama_base_url, self.model_name)
            else:
                print(f"❌ Tipo de factura no soportado: {invoice_type}")
                return None
        except Exception as e:
            print(f"❌ Error procesando factura tipo {invoice_type}: {e}")
            return None