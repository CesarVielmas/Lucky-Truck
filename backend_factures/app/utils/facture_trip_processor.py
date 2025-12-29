import re
import json
import requests
from decimal import Decimal
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.model_truck_facture import FactureTrip

def process_facture_trip_invoice(text: str, ollama_base_url: str, model_name: str) -> Optional[FactureTrip]:
    if not text or len(text.strip()) == 0:
        return None

    try:
        structured_data = _get_structured_data_from_ai(text, ollama_base_url, model_name, _get_enhanced_prompt())
        
        if not structured_data:
            print("❌ La IA no devolvió datos estructurados.")
            return None
        
        # Validación mínima de campos críticos
        if not structured_data.get('name_business'):
            print("❌ Campo name_business es requerido")
            return None
            
        mapped_data = _map_to_pydantic_format(structured_data)
        facture = FactureTrip(**mapped_data)
        return facture
        
    except Exception as e:
        print(f"❌ Error crítico en el proceso de factura weekend: {e}")
        return None

def _get_enhanced_prompt() -> str:
    return """
    Eres un especialista en extracción de datos de documentos de recepción de materiales.
    El texto proviene de OCR y puede contener errores, estar desordenado, o tener formatos variables.
    
    Tu tarea es ANALIZAR el texto COMPLETO y EXTRAER inteligentemente la información relevante 
    basándote en el CONTEXTO y SIGNIFICADO de los datos.

    Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura:

    {
      "name_business": "string",
      "business_region": "string",
      "business_ubication": "string",
      "key": "string",
      "code_facture": "string",
      "type_material": "string",
      "type_movement": "string",
      "date_entry": "string",
      "cuantity_bales": "entero",
      "container": "entero",
      "type_document": "string",
      "date_exit": "string",
      "proveedor": "string",
      "name_transport": "string",
      "name_operator": "string",
      "plates": "string",
      "ubication_trip": "string",
      "gross_weight": "decimal",
      "tare_weight": "decimal",
      "net_weight": "decimal",
      "not_suitable": "decimal",
      "forbiden_weight": "decimal",
      "humidity": "decimal",
      "kg_desc_not_suitable": "decimal",
      "kg_desc_forbiden": "decimal",
      "kg_desc_humidity": "decimal",
      "kg_desc_accepted_weight": "decimal",
      "recibes_trip": "string"
    }

    REGLAS CRÍTICAS PARA FECHAS - DEBES SEGUIR ESTAS ESTRATEGIAS:

    1. **FECHAS - FORMATO OBLIGATORIO**:
       - TODAS las fechas DEBEN estar en formato: "YYYY-MM-DD HH:MM:SS"
       - Si falta la hora, usa "00:00:00"
       - Ejemplos:
         * "9/25/2025 10:32:22AM" → "2025-09-25 10:32:22"
         * "27 SEP 2025" → "2025-09-27 00:00:00"
         * "25/09/2025" → "2025-09-25 00:00:00"

    2. **EXTRACCIÓN DE FECHAS**:
       - Busca TODOS los patrones de fecha en el texto
       - Convierte CADA fecha que encuentres al formato requerido
       - NO devuelvas NUNCA null o vacío para date_entry, date_exit o recibes_trip

    3. **date_entry y date_exit**:
       - Busca específicamente después de "Entrada" y "Salida"
       - Si no encuentras, usa las fechas que tengan contexto de tiempo (hora más temprana para entrada, más tardía para salida)

    4. **recibes_trip** (FECHA DE RECEPCIÓN):
       - Busca TODAS las fechas en el documento
       - La fecha de recepción es la FECHA MÁS RECIENTE (cronológicamente mayor)
       - Si hay múltiples fechas del mismo día, busca indicadores como "RECIBIDO", "Elaboro", "RECEPCIÓN"
       - SIEMPRE debe haber una fecha para recibes_trip

    5. **business_region** (REGION/NEGOCIO):
       - Busca nombres de plantas que aparezcan CERCA del nombre de la empresa principal
       - Ejemplo: "RECICLADORA GUADALUPE" → "GUADALUPE"
       - También busca "PLANTA [NOMBRE]" 
       - Prioridad: nombres que parezcan ubicaciones geográficas

    6. **business_ubication** (UBICACIÓN FÍSICA):
       - Busca la dirección MÁS COMPLETA en el documento
       - Normalmente incluye: calle, número, colonia, ciudad, estado, código postal
       - Es normalmente la cadena de texto más larga que parece una dirección

    7. **code_facture** (CÓDIGO DE FACTURA):
       - Busca códigos que combinen letras y números
       - Si la región está identificada, el código suele empezar con sus iniciales (3-4 letras)
       - Ejemplo: región "GUADALUPE" → código podría ser "GPE", "GDL", "GUAD"
       - Si no encuentras código específico, déjalo vacío ""

    8. **CAMPOS NUMÉRICOS**:
       - Convierte "39,450.00" → 39450.0 (sin comas)
       - Convierte "0,001" → 0.001 (coma a punto decimal)
       - Para enteros: solo el número sin decimales

    EJEMPLO PRÁCTICO CON EL TEXTO PROPORCIONADO:

    Texto contiene:
    - "Entrada\t9/25/2025 10:32:22AM" → date_entry: "2025-09-25 10:32:22"
    - "Salida\t9/25/2025 11:12:32AM" → date_exit: "2025-09-25 11:12:32"  
    - "27 SEP 2025" y "25 SEP 2025" → recibes_trip: "2025-09-27 00:00:00" (fecha más reciente)
    - "RECICLADORA GUADALUPE" → business_region: "GUADALUPE"
    - "GUADALUPE CAMINO A VAQUERIAS NO. 300 COL XOCHIMILCO NUEVO LEON MEXICO 67190" → business_ubication
    - "FACTURA: 0" → code_facture: "GPE" (iniciales de GUADALUPE)

    INSTRUCCIÓN FINAL MÁS IMPORTANTE:
    - NUNCA devuelvas null, undefined o campos vacíos para las fechas
    - SIEMPRE convierte las fechas al formato "YYYY-MM-DD HH:MM:SS"
    - Si no encuentras una fecha específica, usa la fecha más probable según el contexto

    Devuelve ÚNICAMENTE el JSON, sin texto adicional.
    """

def _get_structured_data_from_ai(text: str, ollama_base_url: str, model_name: str, system_prompt: str) -> Optional[Dict[str, Any]]:
    """Obtiene datos estructurados de la IA de Ollama"""
    payload = {
        "model": model_name,
        "prompt": f"Texto completo del documento (EXTRAE TODAS LAS FECHAS y conviértelas al formato requerido):\n{text}",
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
        
        # Extraer JSON de la respuesta
        start = ai_response_text.find('{')
        end = ai_response_text.rfind('}') + 1
        if start == -1 or end == 0:
            print("❌ La IA no devolvió un JSON válido.")
            return None

        json_string = ai_response_text[start:end]
        structured_data = json.loads(json_string)
        print(f"✅ Datos extraídos por IA: {len(structured_data)} campos")
        return structured_data

    except Exception as e:
        print(f"❌ Error al obtener datos de la IA: {e}")
        return None

def _map_to_pydantic_format(ai_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convierte los tipos de datos al formato esperado por Pydantic
    Con validación robusta para fechas
    """
    mapped_data = {}
    
    # Campos de texto - mantener como están o string vacío
    string_fields = [
        'name_business', 'business_region', 'business_ubication', 'key',
        'code_facture', 'type_material', 'type_movement', 'type_document',
        'proveedor', 'name_transport', 'name_operator', 'plates', 'ubication_trip'
    ]
    
    for field in string_fields:
        value = ai_data.get(field)
        if value is None:
            mapped_data[field] = ""
        else:
            cleaned_value = str(value).strip()
            mapped_data[field] = cleaned_value

    # Campos numéricos enteros
    int_fields = ['cuantity_bales', 'container']
    for field in int_fields:
        value = ai_data.get(field, 0)
        mapped_data[field] = _safe_int_convert(value)

    # Campos numéricos decimales
    decimal_fields = [
        'gross_weight', 'tare_weight', 'net_weight', 'not_suitable', 
        'forbiden_weight', 'humidity', 'kg_desc_not_suitable', 
        'kg_desc_forbiden', 'kg_desc_humidity', 'kg_desc_accepted_weight'
    ]
    
    for field in decimal_fields:
        value = ai_data.get(field, 0.0)
        mapped_data[field] = _safe_float_convert(value)
    
    # Validación de peso neto
    if (not mapped_data.get('net_weight') or mapped_data['net_weight'] == 0) and mapped_data.get('gross_weight') and mapped_data.get('tare_weight'):
        mapped_data['net_weight'] = mapped_data['gross_weight'] - mapped_data['tare_weight']

    # CAMPOS DE FECHA - MANEJO ROBUSTO
    date_fields = ['date_entry', 'date_exit', 'recibes_trip']
    
    # Primero extraemos todas las fechas del texto original como respaldo
    backup_dates = _extract_all_dates_from_text(ai_data.get('_original_text', ''))
    
    for field in date_fields:
        date_value = ai_data.get(field)
        parsed_date = _parse_flexible_date(date_value)
        
        # Si no se pudo parsear, usar fechas de respaldo según la lógica del campo
        if parsed_date is None:
            if field == 'recibes_trip' and backup_dates:
                # Para recibes_trip usar la fecha más reciente
                parsed_date = max(backup_dates)
            elif backup_dates:
                # Para otras fechas, usar la primera disponible
                parsed_date = backup_dates[0]
            else:
                # Último recurso: fecha actual
                parsed_date = datetime.now()
                print(f"⚠️ Usando fecha actual para {field} por falta de datos")
        
        mapped_data[field] = parsed_date

    return mapped_data

def _extract_all_dates_from_text(text: str) -> list:
    """Extrae todas las fechas del texto como respaldo"""
    dates = []
    
    # Patrones de fecha comunes
    date_patterns = [
        # 9/25/2025 10:32:22AM
        (r'(\d{1,2}/\d{1,2}/\d{4}\s+\d{1,2}:\d{2}:\d{2}[AP]M)', "%m/%d/%Y %I:%M:%S%p"),
        # 25/09/2025
        (r'(\d{1,2}/\d{1,2}/\d{4})', "%d/%m/%Y"),
        # 27 SEP 2025
        (r'(\d{1,2}\s+[A-Z]{3}\s+\d{4})', "%d %b %Y"),
        # 2025-09-25
        (r'(\d{4}-\d{2}-\d{2})', "%Y-%m-%d"),
    ]
    
    for pattern, fmt in date_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            try:
                dt = datetime.strptime(match, fmt)
                dates.append(dt)
            except ValueError:
                continue
    
    return sorted(dates)  # Ordenadas cronológicamente

def _parse_flexible_date(date_value: Any) -> Optional[datetime]:
    """
    Intenta parsear fechas en múltiples formatos
    Devuelve None si no se puede parsear
    """
    if not date_value:
        return None
        
    date_str = str(date_value).strip()
    
    # Si ya es un datetime, devolverlo
    if isinstance(date_value, datetime):
        return date_value
        
    # Intentar diferentes formatos
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %I:%M:%S%p",
        "%m/%d/%Y %H:%M:%S", 
        "%m/%d/%Y %I:%M:%S%p",
        "%d %b %Y",
        "%d %B %Y",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    print(f"⚠️ No se pudo parsear la fecha: {date_str}")
    return None

def _safe_float_convert(value: Any) -> float:
    """Convierte seguro a float"""
    try:
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            clean_value = str(value).replace(',', '').replace('$', '').strip()
            if clean_value:
                return float(clean_value)
        return 0.0
    except (ValueError, TypeError):
        return 0.0

def _safe_int_convert(value: Any) -> int:
    """Convierte seguro a entero"""
    try:
        if isinstance(value, int):
            return value
        if isinstance(value, float):
            return int(value)
        if isinstance(value, str):
            clean_value = re.sub(r'[^\d.-]', '', value.replace(',', ''))
            if clean_value:
                return int(float(clean_value))
        return 0
    except (ValueError, TypeError):
        return 0