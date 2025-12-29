import json
from typing import Any, Dict, List
from fastapi import APIRouter, Body, File, Form, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect,status
from pydantic import BaseModel, ValidationError
from app.models.model_recibe_facture import FactureWeekend
from app.models.model_truck_facture import FactureTrip
from app.services.file_manager_service import FileManagerService
from app.services.processing_images import ImageProcessorService

file_manager = FileManagerService()
image_processor = ImageProcessorService()
router = APIRouter(prefix="/facture", tags=["FACTURES_OF_BUSINESS"])

class CorrectionRequest(BaseModel):
    model_type: str
    corrected_data: Dict[str, Any]
INVOICE_MODELS = {
    "facture_weekend": FactureWeekend, 
    "facture_trip": FactureTrip,      
    # "type2": InvoiceModel2,      
}
def get_model_class(model_type: str):
    return INVOICE_MODELS.get(model_type)

@router.post("/image")
async def recibe_image_facture(
    request : Request,
    files: List[UploadFile] = File(..., description="Múltiples imágenes de facturas"),
    enhance_ocr: bool = Form(True, description="Mejorar calidad de las imagenes"),
    process_in_parallel: bool = Form(True, description="Procesar imágenes en paralelo"),
    limit_thinking_ai : int = Form(2, description="Número de ejemplos de aprendizaje para IA")):
    try:
        processing_result = await image_processor.process_images(files=files,enhance_ocr=enhance_ocr,process_in_parallel=process_in_parallel,base_api_url=request.base_url,limit_thinking_ai=limit_thinking_ai)
        return {
            "success": True,
            "status": status.HTTP_200_OK,
            "message": "Imágenes procesadas exitosamente",
            "data": processing_result,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "message": "Error procesando imágenes",
            "data": None,
            "error": str(e)
        }
        
@router.put("/correct/")
async def correct_invoice_data(
    request: Request,
    path_dir: str, 
    correction_request: CorrectionRequest = Body(..., description="Datos corregidos con tipo de modelo")
):
    try:
        model_type = correction_request.model_type
        corrected_data = correction_request.corrected_data
        model_class = get_model_class(model_type)
        if not model_class:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de modelo no soportado: {model_type}. Tipos válidos: {list(INVOICE_MODELS.keys())}"
            )
        try:
            validated_data = model_class(**corrected_data)
        except ValidationError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Error de validación en los datos: {e.errors()}"
            )
        
        correction_result = file_manager.correct_invoice_data(
            path_dir=path_dir,
            model_type=model_type,
            corrected_data=validated_data.dict()
        )
        
        if not correction_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=correction_result["error"]
            )
        
        return {
            "success": True,
            "status": status.HTTP_200_OK,
            "message": "Datos corregidos exitosamente",
            "data": {
                "data_facture": correction_result["data_facture"]
            },
            "error": None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "message": "Error corrigiendo los datos",
            "data": None,
            "error": str(e)
        }
@router.get("/background-service/status")
async def get_background_service_status():
    if file_manager and file_manager.background_organizer:
        return {
            "is_running": file_manager.background_organizer.is_running,
            "check_interval_minutes": file_manager.background_organizer.check_interval_minutes
        }
    return {"is_running": False, "error": "Servicio no inicializado"}

@router.post("/background-service/organize-now")
async def organize_now():
    if file_manager:
        result = file_manager.organize_pending_trips_now()
        return result
    return {"success": False, "error": "Servicio no inicializado"}

@router.get("/")
async def instructions_message():
    return {
        "success": True,
        "status": status.HTTP_200_OK,
        "message": "Welcome To Facture Processing API",
        "data": {
            "endpoints_available": {
                "process_images": "/facture/image (POST)",
                "correct_data": "/facture/correct/{empresa}/{fecha_carpeta} (PUT)", 
                "verify_invoice": "/facture/verify/{empresa}/{fecha_carpeta} (GET)",
                "list_invoices": "/facture/list/{empresa} (GET)"
            }
        },
        "error": None
    }  
