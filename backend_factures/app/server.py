import atexit
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import threading
import time
from app.routes import router_facture
from app.services.file_manager_service import FileManagerService
file_manager_service = None
@asynccontextmanager
async def lifespan(app: FastAPI):
    global file_manager_service
    file_manager_service = FileManagerService()
    file_manager_service.start_background_organizer(check_interval_minutes=60)
    print("✅ Servicio en segundo plano iniciado")
    yield
    if file_manager_service:
        file_manager_service.stop_background_organizer()
        print("✅ Servicio en segundo plano detenido")

app = FastAPI(
    title="Factures",
    description="Create And Organize Factures",
    lifespan=lifespan
)

app.include_router(
    router_facture.router,
    prefix="/api",
    tags=["AI_MODEL"]
)

factures_path = Path("Facturas")
temp_path = Path("temp")
app.mount("/Facturas", StaticFiles(directory=factures_path), name="Facturas")
app.mount("/temp", StaticFiles(directory=temp_path), name="temp")
