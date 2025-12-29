import threading
import colorlog
import schedule
import time
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
import logging

class BackgroundTripOrganizer:
    def __init__(self, file_manager, check_interval_minutes: int = 60):
        self.file_manager = file_manager
        self.check_interval_minutes = check_interval_minutes
        self.is_running = False
        self.thread = None
        self.logger = self._setup_colored_logger()

        if not self.logger.handlers:
            logging.basicConfig(
                level=logging.INFO,
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
    def _setup_colored_logger(self):
        logger = logging.getLogger('BackgroundTripOrganizer')
        if logger.handlers:
            return logger
            
        logger.setLevel(logging.INFO)
        formatter = colorlog.ColoredFormatter(
            '%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S',
            log_colors={
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            }
        )
        handler = colorlog.StreamHandler()
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        return logger
    def start(self):
        if self.is_running:
            self.logger.warning("El organizador en segundo plano ya está ejecutándose")
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._run_scheduler, daemon=True, name="BackgroundTripOrganizer")
        self.thread.start()
        self.logger.info(f"✅ Organizador en segundo plano iniciado. Revisando cada {self.check_interval_minutes} minutos")
        
    def stop(self):
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
        self.logger.info("🛑 Organizador en segundo plano detenido")
        
    def _run_scheduler(self):
        self.logger.info("🔄 Iniciando loop del planificador...")
        self._organize_pending_trips()
        schedule.every(self.check_interval_minutes).minutes.do(self._organize_pending_trips)
        while self.is_running:
            try:
                schedule.run_pending()
                time.sleep(30) 
            except Exception as e:
                self.logger.error(f"❌ Error en el organizador en segundo plano: {e}")
                time.sleep(60)  
                
        self.logger.info("🔄 Loop del planificador terminado")
                
    def _organize_pending_trips(self):
        try:
            self.logger.info("🔍 Revisando facturas trip pendientes en temp...")
            pending_trips = self.file_manager.get_all_trips_in_temp()
            if not pending_trips:
                self.logger.info("📭 No hay facturas trip pendientes en temp")
                return
                
            self.logger.info(f"📦 Encontradas {len(pending_trips)} facturas trip pendientes")
            
            moved_count = 0
            error_count = 0
            
            for trip in pending_trips:
                try:
                    trip_data = trip['data']['data_facture']
                    date_str = trip_data.get('recibes_trip')
                    if date_str:
                        try:
                            date_str = date_str.replace(" ", "T")
                            dt = datetime.fromisoformat(date_str)
                            date_str = dt.strftime("%Y-%m-%d")
                        except Exception:
                            date_str = "invalid_date"
                    else:
                        date_str = "unknown_date"
                    trip_folder_name = f"{date_str}_{trip_data.get('code_facture')}"
                    code_facture = trip_data.get('code_facture', '')
                    recibes_trip = trip_data.get('recibes_trip', '')
                    name_business = trip_data.get('name_business', 'Desconocida').split(",")[0]
                    
                    if not code_facture:
                        self.logger.warning(f"⚠️ Trip {trip_folder_name} no tiene code_facture, omitiendo")
                        continue
                    fecha_dt = self.file_manager._parse_datetime(recibes_trip)
                    target_folder = self.file_manager._find_weekend_folder_for_trip(code_facture, fecha_dt,name_business)
                    
                    if target_folder:
                        result = self.file_manager.move_trip_from_temp_to_weekend(
                            trip_folder_name, target_folder  
                        )
                            
                        if result['success']:
                            moved_count += 1
                            self.logger.info(f"✅ Trip {trip_folder_name} movido a {target_folder}")
                        else:
                            error_count += 1
                            self.logger.error(f"❌ Error moviendo trip {trip_folder_name}: {result.get('error', 'Error desconocido')}")
                    else:
                        self.logger.debug(f"⏳ Trip {trip_folder_name} aún no tiene facture_weekend correspondiente")
                        
                except Exception as e:
                    error_count += 1
                    self.logger.error(f"❌ Error procesando trip {trip.get('folder_name', 'desconocido')}: {e}")
            
            if moved_count > 0:
                self.logger.info(f"🎉 Organización completada: {moved_count} trips movidos, {error_count} errores")
            elif error_count > 0:
                self.logger.warning(f"⚠️ Organización completada con {error_count} errores")
            else:
                self.logger.info("ℹ️ No se movieron trips (ninguno tiene facture_weekend correspondiente aún)")
                
        except Exception as e:
            self.logger.error(f"💥 Error crítico en _organize_pending_trips: {e}")

    def organize_now(self) -> Dict[str, Any]:
        try:
            self.logger.info("🚀 Ejecutando organización inmediata de trips pendientes...")
            self._organize_pending_trips()
            return {"success": True, "message": "Organización inmediata completada"}
        except Exception as e:
            self.logger.error(f"❌ Error en organización inmediata: {e}")
            return {"success": False, "error": str(e)}