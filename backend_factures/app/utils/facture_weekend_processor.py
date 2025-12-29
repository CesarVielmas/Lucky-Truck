import re
import json
import requests
from decimal import Decimal
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.model_recibe_facture import FactureWeekend

def process_facture_weekend_invoice(text: str, ollama_base_url: str, model_name: str) -> Optional[FactureWeekend]:
    if not text or len(text.strip()) == 0:
        return None

    try:
        structured_data = _get_structured_data_from_ai(text, ollama_base_url, model_name, _get_transport_prompt())
        
        if not structured_data:
            return None
        if not structured_data.get('rfc_emisor') or not structured_data.get('tax_folio'):
            print("❌ JSON de la IA carece de campos críticos (RFC Emisor o Folio Fiscal).")
            return None
        structured_data = _apply_transport_corrections(structured_data, text)
        mapped_data = _map_transport_data_to_pydantic(structured_data)
        facture = FactureWeekend(**mapped_data)
        return facture
        
    except Exception as e:
        print(f"❌ Error crítico en el proceso de factura semanal con IA: {e}")
        return None

def _get_transport_prompt() -> str:
    return """
    Eres un especialista en extracción de datos de facturas CFDI mexicanas DE TRANSPORTE.
    Tu tarea es analizar el texto proporcionado y extraer la información relevante para devolver ÚNICAMENTE un objeto JSON válido.
    El JSON DEBE seguir ESTRICTAMENTE la estructura y los nombres de campo que se te indican a continuación.

    Estructura JSON requerida:
    {
      "rfc_emisor": "string",
      "name_emisor": "string", 
      "rfc_receptor": "string",
      "name_receptor": "string",
      "postal_code_receptor": "string",
      "tax_folio": "string (UUID)",
      "no_csd": "string (NÚMERO DE SERIE DEL CSD, NO LA FECHA)",
      "postal_code_emisor": "string",
      "datetime_emisor": "string en formato YYYY-MM-DD HH:MM:SS",
      "concepts": [
        {
          "product_code": "string",
          "cuantity_trips": "número entero (CANTIDAD REAL DE VIAJES, NO EL IMPORTE)",
          "key_unit": "string",
          "type_unit": "string (DEBE SER 'Unidad de servicio' PARA SERVICIOS)",
          "value_unit": "decimal (VALOR UNITARIO REAL)",
          "import_total": "decimal",
          "discount": "string o null",
          "object_duty": "booleano",
          "description": "string",
          "dutys_of_concept": [
            {
              "duty": "string (e.g., IVA)",
              "type_duty": "string (e.g., Traslado, Retención)",
              "base_import": "decimal",
              "type_factor": "string",
              "rate_fee": "string (e.g., 16.00%, 4.00%)",
              "import_with_fee_rate": "decimal"
            }
          ]
        }
      ],
      "type_money": "string",
      "type_pay": "string",
      "method_pay": "string",
      "subtotal": "decimal",
      "transferred_taxes": "decimal",
      "stoped_taxes": "decimal",
      "total": "decimal",
      "url_qr": "string"
    }

    INSTRUCCIONES CRÍTICAS Y CORRECCIONES ESPECÍFICAS:

    1. PARA 'tax_folio' (FOLIO FISCAL - UUID):
       - BUSCAR específicamente "Folio fiscal:" seguido de un UUID
       - Formato: "BE1A4C10-FA5C-43A9-8957-E21BD5A7F462" (con guiones)
       - NO confundir con el número de CSD
       - Ejemplo en el texto: "BE1A4C10-FA5C-43A9-8957-E21BD5A7F462"

    2. PARA 'no_csd' (NÚMERO DE SERIE DEL CSD):
       - BUSCAR específicamente "No. de serie del CSD:" 
       - ES UN NÚMERO LARGO como "00001000000718612524", NO UNA FECHA
       - NO confundir con el UUID

    3. PARA 'product_code' EN CONCEPTOS:
       - BUSCAR en la sección de conceptos el "Clave del producto"
       - Debe ser "78101801" (código numérico), NO "E48"
       - "E48" corresponde a key_unit

    4. PARA 'key_unit' EN CONCEPTOS:
       - BUSCAR en la sección de conceptos la "Clave de unidad"
       - Debe ser "E48", NO "Unidad de servicio"
       - "Unidad de servicio" corresponde a type_unit

    5. PARA 'url_qr':
       - DEBE SER: "https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=<tax_folio>"
       - Reemplazar <tax_folio> con el UUID correcto
       - NO usar el sello digital o texto aleatorio

    6. PARA 'cuantity_trips' (CANTIDAD DE VIAJES):
       - NO usar el número 5,000 (ese es el valor unitario)
       - La cantidad REAL se infiere de la descripción:
         * Ejemplo: "Flete local de Planta Santa Catarina a PCM SAC5659 SAC5650 SAC5609" = 3 viajes
         * Contar los destinos únicos en la descripción (SAC5659, SAC5650, SAC5609 = 3 viajes)
       - Si no se puede inferir, usar 1

    7. PARA 'type_unit':
       - DEBE SER "Unidad de servicio" para servicios de transporte

    8. PARA 'value_unit' (VALOR UNITARIO):
       - Es el precio por UNIDAD de servicio
       - Calcular: value_unit = import_total / cuantity_trips

    9. REGLAS GENERALES:
       - Los valores decimales como números: 15000.00 (no strings)
       - Para 'url_qr', usar siempre el formato: "https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=<UUID>"
       - Verificar que tax_folio sea un UUID válido con guiones

    ¡PRESTA ESPECIAL ATENCIÓN A ESTAS CONFUSIONES COMUNES!
    Devuelve ÚNICAMENTE el JSON, sin texto adicional.
    """

def _get_structured_data_from_ai(text: str, ollama_base_url: str, model_name: str, system_prompt: str) -> Optional[Dict[str, Any]]:
    payload = {
        "model": model_name,
        "prompt": f"Texto de la factura CFDI a analizar (PRESTA ATENCIÓN A LOS DETALLES):\n{text}",
        "system": system_prompt,
        "stream": False,
        "format": "json"
    }
    try:
        response = requests.post(
            f"{ollama_base_url}/api/generate",
            json=payload,
            timeout=120
        )
        response.raise_for_status()
        response_json = response.json()
        ai_response_text = response_json.get("response", "").strip()
        start = ai_response_text.find('{')
        end = ai_response_text.rfind('}') + 1
        if start == -1 or end == 0:
            print("❌ La IA no devolvió un JSON válido.")
            return None

        json_string = ai_response_text[start:end]
        structured_data = json.loads(json_string)
        return structured_data

    except Exception as e:
        print(f"❌ Error al obtener datos de la IA para transporte: {e}")
        return None

def _apply_transport_corrections(ai_data: Dict[str, Any], original_text: str) -> Dict[str, Any]:
    corrected_data = ai_data.copy()
    uuid_pattern = r'[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}'
    uuid_match = re.search(uuid_pattern, original_text, re.IGNORECASE)
    if uuid_match:
        correct_uuid = uuid_match.group(0)
        if corrected_data.get('tax_folio') != correct_uuid:
            corrected_data['tax_folio'] = correct_uuid

    if not corrected_data.get('no_csd') or corrected_data['no_csd'] == '2025-10-29 19:19:49':
        csd_patterns = [
            r'No\.?\s*de\s*serie\s*del\s*CSD[^\d]*(\d{10,})',
            r'CSD[^\d]*(\d{10,})',
            r'00001000000718612524'
        ]
        for pattern in csd_patterns:
            match = re.search(pattern, original_text)
            if match:
                corrected_data['no_csd'] = match.group(1)
                break
        else:
            corrected_data['no_csd'] = ""
            print("⚠️ No se encontró el número CSD")

    concept_pattern = r'(\d{8})\s+([A-Z]\d{2})\s+([^\t\n]+)\s+([\d,]+\.\d{2,6})'
    concept_match = re.search(concept_pattern, original_text)
    
    if concept_match and corrected_data.get('concepts'):
        product_code = concept_match.group(1)  
        key_unit = concept_match.group(2)      
        
        for concept in corrected_data['concepts']:
            if concept.get('product_code') != product_code:
                concept['product_code'] = product_code
            
            if concept.get('key_unit') != key_unit:
                concept['key_unit'] = key_unit
    for concept in corrected_data.get('concepts', []):
        if concept.get('type_unit') in ['Tipo', '']:
            concept['type_unit'] = 'Unidad de servicio'
    for concept in corrected_data.get('concepts', []):
        description = concept.get('description', '')
        if description and 'SAC' in description:
            sac_codes = re.findall(r'SAC\d+', description)
            unique_sac_codes = set(sac_codes)
            inferred_quantity = len(unique_sac_codes)
            
            if inferred_quantity > 0 and inferred_quantity != concept.get('cuantity_trips', 0):
                old_quantity = concept.get('cuantity_trips', 0)
                concept['cuantity_trips'] = inferred_quantity
        
        if concept.get('cuantity_trips', 0) <= 0:
            concept['cuantity_trips'] = 1
            print("⚠️ Usando cantidad por defecto: 1")
    for concept in corrected_data.get('concepts', []):
        import_total = concept.get('import_total', 0)
        quantity = concept.get('cuantity_trips', 1)
        
        if isinstance(import_total, (int, float, Decimal)) and quantity > 0:
            calculated_value_unit = Decimal(str(import_total)) / Decimal(str(quantity))
            current_value_unit = concept.get('value_unit', 0)
            if (calculated_value_unit != current_value_unit and 
                calculated_value_unit > Decimal('0.01') and 
                calculated_value_unit < Decimal('1000000')):
                
                concept['value_unit'] = float(calculated_value_unit) if isinstance(calculated_value_unit, Decimal) else calculated_value_unit
    subtotal = corrected_data.get('subtotal', 0)
    transferred_taxes = corrected_data.get('transferred_taxes', 0)
    total = corrected_data.get('total', 0)
    current_stoped_taxes = corrected_data.get('stoped_taxes', 0)
    
    expected_stoped_taxes = total - subtotal - transferred_taxes
    
    retencion_patterns = [
        r'Impuestos\s+retenidos[^\d]*\$?\s*([0-9,]+\.\d{2})',
        r'IVA\s+Retención[^\d]*([0-9,]+\.\d{2,6})',
        r'retenidos[^\d]*\$?\s*([0-9,]+\.\d{2})'
    ]
    
    found_retencion = None
    for pattern in retencion_patterns:
        match = re.search(pattern, original_text)
        if match:
            found_retencion = _safe_decimal_convert(match.group(1))
            break
    
    if found_retencion and found_retencion > 0:
        corrected_data['stoped_taxes'] = found_retencion
    elif expected_stoped_taxes > 0 and abs(expected_stoped_taxes - current_stoped_taxes) > Decimal('0.01'):
        corrected_data['stoped_taxes'] = expected_stoped_taxes
    if corrected_data.get('tax_folio'):
        correct_url = f"https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id={corrected_data['tax_folio']}"
        if corrected_data.get('url_qr') != correct_url:
            corrected_data['url_qr'] = correct_url

    return corrected_data

def _map_transport_data_to_pydantic(ai_data: Dict[str, Any]) -> Dict[str, Any]:
    mapped_data = ai_data.copy()

    if 'concepts' not in mapped_data or not isinstance(mapped_data['concepts'], list):
        mapped_data['concepts'] = []

    for concept in mapped_data['concepts']:
        if 'dutys_of_concept' not in concept or not isinstance(concept['dutys_of_concept'], list):
            concept['dutys_of_concept'] = []

        if 'cuantity_trips' in concept:
            concept['cuantity_trips'] = _safe_int_convert(concept['cuantity_trips'])
        else:
            concept['cuantity_trips'] = 1

        concept['object_duty'] = concept.get('object_duty', False) or len(concept['dutys_of_concept']) > 0

        decimal_fields_concept = ['value_unit', 'import_total']
        for field in decimal_fields_concept:
            value = concept.get(field, '0.00')
            concept[field] = _safe_decimal_convert(value)
        for duty in concept['dutys_of_concept']:
            decimal_fields_duty = ['base_import', 'import_with_fee_rate']
            for field in decimal_fields_duty:
                value = duty.get(field, '0.00')
                duty[field] = _safe_decimal_convert(value)

    decimal_fields_invoice = ['subtotal', 'transferred_taxes', 'stoped_taxes', 'total']
    for field in decimal_fields_invoice:
        value = mapped_data.get(field, '0.00')
        mapped_data[field] = _safe_decimal_convert(value)

    fecha_str = mapped_data.get('datetime_emisor')
    if fecha_str:
        try:
            formatted_fecha = fecha_str.replace('T', ' ').replace('/', '-')
            mapped_data['datetime_emisor'] = datetime.strptime(formatted_fecha, "%Y-%m-%d %H:%M:%S")
        except ValueError as e:
            print(f"⚠️ No se pudo parsear la fecha '{fecha_str}'. Se usará None. Error: {e}")
            mapped_data['datetime_emisor'] = None
    else:
        mapped_data['datetime_emisor'] = None
    if not mapped_data.get('url_qr') and mapped_data.get('tax_folio'):
        mapped_data['url_qr'] = f"https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id={mapped_data['tax_folio']}"

    return mapped_data

def _safe_decimal_convert(value: Any) -> Decimal:
    try:
        if isinstance(value, Decimal):
            return value
        if isinstance(value, (int, float)):
            return Decimal(str(value))
        clean_value = str(value).replace(',', '').replace('$', '').strip()
        return Decimal(clean_value) if clean_value else Decimal('0.00')
    except:
        return Decimal('0.00')

def _safe_int_convert(value: Any) -> int:
    try:
        if isinstance(value, int):
            return value
        if isinstance(value, float):
            return int(value)
        if isinstance(value, str):
            clean_value = re.sub(r'[^\d.-]', '', value.replace(',', ''))
            return int(float(clean_value)) if clean_value else 1
        return 1
    except Exception as e:
        print(f"⚠️ No se pudo convertir a entero: {value}. Error: {e}")
        return 1