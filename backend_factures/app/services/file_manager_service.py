from dataclasses import asdict
import os
import json
import shutil
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
import re
from pathlib import Path
import imghdr
from app.api.trips_organizer import BackgroundTripOrganizer

class FileManagerService:
    def __init__(self, base_path: str = "Facturas"):
        self.base_path = Path(base_path)
        self.temp_path = Path("temp")
        self.base_path.mkdir(exist_ok=True)
        self.background_organizer = BackgroundTripOrganizer(self)

    def start_background_organizer(self, check_interval_minutes: int = 60):
        self.background_organizer.check_interval_minutes = check_interval_minutes
        self.background_organizer.start()
        
    def stop_background_organizer(self):
        self.background_organizer.stop()
        
    def organize_pending_trips_now(self) -> Dict[str, Any]:
        return self.background_organizer.organize_now()
    
    def organize_invoice(
        self,  
        data,
        original_image: bytes,
        enhanced_image: bytes,
        data_crud: str = "",
        type_organization: str = ""
    ) -> Dict[str, Any]:
        try:
            if type_organization == "facture_weekend":
                return self.facture_weekend_organize(data, data_crud, original_image, enhanced_image)
            if type_organization == "facture_trip":
                return self.facture_trip_organize(data, data_crud, original_image, enhanced_image)
            else:
                return {"success": False, "error": "Tipo de organización no soportado"}
        except Exception as e:
            print(f"❌ Error organizando factura: {e}")
            return {"success": False, "error": str(e)}
    def facture_trip_organize(self, data, data_crud: str, original_image: bytes, enhanced_image: bytes) -> Dict[str, Any]:
        try:
            code_facture = data.code_facture
            recibes_trip = data.recibes_trip
            
            if not code_facture:
                return {"success": False, "error": "code_facture es requerido"}
            if isinstance(recibes_trip, str):
                try:
                    if 'T' in recibes_trip:
                        fecha_dt = datetime.fromisoformat(recibes_trip.replace('Z', '+00:00'))
                    else:
                        fecha_dt = datetime.strptime(recibes_trip, "%Y-%m-%d %H:%M:%S")
                except:
                    fecha_dt = datetime.now()
            else:
                fecha_dt = recibes_trip
            fecha_str = fecha_dt.strftime("%Y-%m-%d")
            trip_folder_name = f"{fecha_str}_{code_facture}"
            target_folder = self._find_weekend_folder_for_trip(code_facture, fecha_dt,data.name_business.split(",")[0])
            
            if target_folder:
                result = self._save_trip_to_folder(
                    target_folder, trip_folder_name, data, data_crud, original_image, enhanced_image
                )
                result["location"] = "weekend_folder"
            else:
                result = self._save_trip_to_folder(
                    self.temp_path, trip_folder_name, data, data_crud, original_image, enhanced_image
                )
                result["location"] = "temp_folder"
            
            return result
            
        except Exception as e:
            print(f"❌ Error organizando factura trip: {e}")
            return {"success": False, "error": str(e)}

    def _find_weekend_folder_for_trip(self, code_facture: str, trip_date: datetime,business : str) -> Optional[Path]:
        try:
            company_folder = self.base_path / business
            if not company_folder.exists():
                return None
            
            for weekend_folder in company_folder.iterdir():
                if not weekend_folder.is_dir():
                    continue
                folder_name = weekend_folder.name
                try:
                    folder_date = datetime.strptime(folder_name.split('_')[0], "%Y-%m-%d")
                    if folder_date.date() < trip_date.date():
                        continue
                        
                except ValueError:
                    continue
                json_file = weekend_folder / "factura.json"
                if not json_file.exists():
                    continue
                
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        weekend_data = json.load(f)
                    if 'data_facture' not in weekend_data:
                        continue
                    data_facture = weekend_data['data_facture']
                    if 'concepts' in data_facture and isinstance(data_facture['concepts'], list):
                        for concept in data_facture['concepts']:
                            description = concept.get('description', '')
                            if code_facture in description:
                                return weekend_folder
                    general_description = data_facture.get('description', '')
                    if code_facture in general_description:
                        return weekend_folder
                        
                except Exception as e:
                    print(f"⚠️ Error leyendo JSON de {json_file}: {e}")
                    continue
                    
            return None
            
        except Exception as e:
            print(f"❌ Error buscando weekend folder: {e}")
            return None

    def _save_trip_to_folder(
        self, 
        parent_folder: Path, 
        trip_folder_name: str, 
        data, 
        data_crud: str,
        original_image: bytes, 
        enhanced_image: bytes
    ) -> Dict[str, Any]:
        try:
            trip_folder = parent_folder / trip_folder_name
            trip_folder.mkdir(exist_ok=True)
            json_data = {
                "metadata": {
                    "processed_at": datetime.now().isoformat(),
                    "type": "facture_trip",
                    "folder_name": trip_folder_name
                },
                "data_facture": data.dict(),
                "data_crud": data_crud
            }
            
            json_file = trip_folder / "factura.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, indent=2, ensure_ascii=False,default=str)
    
            original_file = trip_folder / "factura_original.jpeg"
            with open(original_file, 'wb') as f:
                f.write(original_image)
            enhanced_file = trip_folder / "factura_enhanced.png"
            with open(enhanced_file, 'wb') as f:
                f.write(enhanced_image)
            return {
                "success": True,
                "message": f"Factura trip guardada en {trip_folder}",
                "folder_path": str(trip_folder),
                "archivos_guardados": [
                    f"{trip_folder}/factura.json",
                    f"{trip_folder}/factura_original.jpeg", 
                    f"{trip_folder}/factura_enhanced.png"
                ]
            }
            
        except Exception as e:
            print(f"❌ Error guardando archivos trip: {e}")
            return {"success": False, "error": str(e)}

    def get_all_trips_in_temp(self) -> List[Dict[str, Any]]:
        trips = []
        try:
            for trip_folder in self.temp_path.iterdir():
                if not trip_folder.is_dir():
                    continue
                
                json_file = trip_folder / "factura.json"
                if json_file.exists():
                    try:
                        with open(json_file, 'r', encoding='utf-8') as f:
                            trip_data = json.load(f)
                        trips.append({
                            "folder_name": trip_folder.name,
                            "data": trip_data,
                            "path": str(trip_folder)
                        })
                    except Exception as e:
                        print(f"⚠️ Error leyendo trip {trip_folder}: {e}")
                        
        except Exception as e:
            print(f"❌ Error obteniendo trips de temp: {e}")
            
        return trips

    def move_trip_from_temp_to_weekend(self, trip_folder_name: str, weekend_folder: Path) -> Dict[str, Any]:
        try:
            source_folder = self.temp_path / trip_folder_name
            target_folder = weekend_folder / trip_folder_name
            
            if not source_folder.exists():
                return {"success": False, "error": f"Carpeta {trip_folder_name} no existe en temp"}
            
            if target_folder.exists():
                shutil.rmtree(target_folder)  
            
            shutil.move(str(source_folder), str(target_folder))
            
            return {
                "success": True,
                "message": f"Trip {trip_folder_name} movido a {weekend_folder}",
                "new_path": str(target_folder)
            }
            
        except Exception as e:
            print(f"❌ Error moviendo trip desde temp: {e}")
            return {"success": False, "error": str(e)}
    def facture_weekend_organize(self, data, data_crud: str, original_image: bytes, enhanced_image: bytes):
        path_business = Path(self.base_path / data.name_receptor)
        path_business.mkdir(exist_ok=True)
        if isinstance(data.datetime_emisor, datetime):
            date_emision = data.datetime_emisor
        else:
            date_emision = datetime.fromisoformat(data.datetime_emisor.replace('Z', '+00:00'))
        folder_name = self._create_date_based_folder_name(date_emision)
        path_date_folder = path_business / folder_name
        if path_date_folder.exists():
            self._delete_existing_facture(path_date_folder)
        path_date_folder.mkdir(exist_ok=True)
        return self.organice_archives_week(data, data_crud, path_date_folder, original_image, enhanced_image)

    def _create_date_based_folder_name(self, date_emision: datetime) -> str:
        return date_emision.strftime("%Y-%m-%d_%H-%M-%S")

    def _delete_existing_facture(self, date_folder: Path):
        try:
            for file in date_folder.iterdir():
                if file.is_file():
                    file.unlink()
        except Exception as e:
            print(f"⚠️ Error eliminando archivos en {date_folder}: {e}")

    def organice_archives_week(self, data, data_crud: str, date_folder: Path, original_image: bytes, enhanced_image: bytes):
        if isinstance(data.datetime_emisor, datetime):
            date_emision = data.datetime_emisor
        else:
            date_emision = datetime.fromisoformat(data.datetime_emisor.replace('Z', '+00:00'))
        base_name = f"factura"
        
        archivos_guardados = []
        path_facture_json = date_folder / f"{base_name}.json"
        data_path_facture = {
            "data_crud": data_crud,
            "data_facture": data.dict(),
            "processing_timestamp": datetime.now().isoformat(),
            "date_folder": date_folder.name
        }
        with open(path_facture_json, "w", encoding="utf-8") as f:
            json.dump(data_path_facture, f, ensure_ascii=False, indent=2, default=str)
        archivos_guardados.append(str(path_facture_json))
        if original_image:
            ext_original = imghdr.what(None, h=original_image) or "png"
            path_original_image = date_folder / f"{base_name}_original.{ext_original}"
            with open(path_original_image, "wb") as f:
                f.write(original_image)
            archivos_guardados.append(str(path_original_image))
        
        if enhanced_image:
            ext_enhanced = imghdr.what(None, h=enhanced_image) or "png"
            path_enhanced_image = date_folder / f"{base_name}_enhanced.{ext_enhanced}"
            with open(path_enhanced_image, "wb") as f:
                f.write(enhanced_image)
            archivos_guardados.append(str(path_enhanced_image))    
        return {
            "success": True,
            "empresa": data.name_receptor,
            "carpeta_fecha": date_folder.name,
            "ruta": str(date_folder),
            "archivos_guardados": archivos_guardados,
            "fecha_emision": date_emision.isoformat()
        }

    def get_business_folders(self) -> List[Dict[str, Any]]:
        businesses = []
        for item in self.base_path.iterdir():
            if item.is_dir():
                date_folders = []
                for date_folder in item.iterdir():
                    if date_folder.is_dir() and self._is_valid_date_folder(date_folder.name):
                        date_folders.append({
                            "nombre": date_folder.name,
                            "ruta": str(date_folder),
                            "fecha": self._parse_date_folder_name(date_folder.name)
                        })
                date_folders.sort(key=lambda x: x["fecha"], reverse=True)
                businesses.append({
                    "nombre": item.name,
                    "ruta": str(item),
                    "carpetas_fecha": date_folders,
                    "total_facturas": len(date_folders)
                })
        
        return businesses

    def get_date_folder_contents(self, empresa: str, fecha_carpeta: str) -> Optional[Dict[str, Any]]:
        folder_path = self.base_path / empresa / fecha_carpeta
        if not folder_path.exists() or not folder_path.is_dir():
            return None
        archivos = []
        for file in folder_path.iterdir():
            if file.is_file():
                archivos.append({
                    "nombre": file.name,
                    "ruta": str(file),
                    "tamaño": file.stat().st_size,
                    "extension": file.suffix
                })
        return {
            "empresa": empresa,
            "carpeta_fecha": fecha_carpeta,
            "ruta": str(folder_path),
            "archivos": archivos,
            "total_archivos": len(archivos)
        }
    def correct_invoice_data(
        self, 
        path_dir: str, 
        model_type: str, 
        corrected_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        try:
            folder_path = Path(path_dir)
            if not folder_path.exists():
                return {"success": False, "error": f"Carpeta no encontrada: {path_dir}"}
            json_files = list(folder_path.glob("factura.json"))
            if not json_files:
                return {"success": False, "error": "Archivo de factura no encontrado en la carpeta"}
            json_file_path = json_files[0]
            with open(json_file_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
            original_path = folder_path
            parent_path = folder_path.parent
            existing_data["data_facture"] = corrected_data
            existing_data["corrected_timestamp"] = self._get_current_timestamp()
            existing_data["corrected"] = True
            new_folder_name = self._generate_new_folder_name(model_type, corrected_data)
            new_folder_path = parent_path / new_folder_name
            folder_renamed = False
            if new_folder_name != folder_path.name and not new_folder_path.exists():
                try:
                    folder_path.rename(new_folder_path)
                    folder_renamed = True
                    folder_path = new_folder_path
                    json_file_path = new_folder_path / "factura.json"
                    print(f"✅ Carpeta renombrada: {original_path.name} -> {new_folder_name}")
                except Exception as rename_error:
                    print(f"⚠️ Error renombrando carpeta: {rename_error}")
            with open(json_file_path, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, ensure_ascii=False, indent=2, default=str)
            
            return {
                "success": True,
                "carpeta_fecha": str(folder_path),
                "model_type": model_type,
                "ruta": str(json_file_path),
                "data_facture": existing_data["data_facture"],
                "archivo_actualizado": json_file_path.name,
                "timestamp_correccion": existing_data["corrected_timestamp"],
                "carpeta_renombrada": folder_renamed,
                "nuevo_nombre_carpeta": new_folder_name if folder_renamed else None
            }
            
        except Exception as e:
            print(f"❌ Error corrigiendo factura: {e}")
            return {"success": False, "error": str(e)}

    def _generate_new_folder_name(self, model_type: str, corrected_data: Dict[str, Any]) -> str:
        try:
            if model_type == "facture_weekend":
                return self._generate_weekend_folder_name(corrected_data)
            elif model_type == "facture_trip":
                return self._generate_trip_folder_name(corrected_data)
            else:
                return datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        except Exception as e:
            print(f"⚠️ Error generando nombre de carpeta: {e}")
            return datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

    def _generate_weekend_folder_name(self, corrected_data: Dict[str, Any]) -> str:
        try:
            datetime_emisor = corrected_data.get('datetime_emisor')
            if isinstance(datetime_emisor, str):
                if 'T' in datetime_emisor:
                    fecha_dt = datetime.fromisoformat(datetime_emisor.replace('Z', '+00:00'))
                else:
                    fecha_dt = datetime.strptime(datetime_emisor, "%Y-%m-%d %H:%M:%S")
            else:
                fecha_dt = datetime_emisor if datetime_emisor else datetime.now()
            
            return fecha_dt.strftime("%Y-%m-%d_%H-%M-%S")
        except Exception as e:
            print(f"⚠️ Error generando nombre para weekend: {e}")
            return datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

    def _generate_trip_folder_name(self, corrected_data: Dict[str, Any]) -> str:
        try:
            recibes_trip = corrected_data.get('recibes_trip')
            code_facture = corrected_data.get('code_facture', '')
            if isinstance(recibes_trip, str):
                if 'T' in recibes_trip:
                    fecha_dt = datetime.fromisoformat(recibes_trip.replace('Z', '+00:00'))
                else:
                    fecha_dt = datetime.strptime(recibes_trip, "%Y-%m-%d %H:%M:%S")
            else:
                fecha_dt = recibes_trip if recibes_trip else datetime.now()
            
            fecha_str = fecha_dt.strftime("%Y-%m-%d")
            return f"{fecha_str}_{code_facture}" if code_facture else f"{fecha_str}_trip"
        except Exception as e:
            print(f"⚠️ Error generando nombre para trip: {e}")
            return datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

    def _get_current_timestamp(self) -> str:
        return datetime.now().isoformat()
    def _is_valid_date_folder(self, folder_name: str) -> bool:
        pattern = r'\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}'
        return bool(re.match(pattern, folder_name))

    def _parse_date_folder_name(self, folder_name: str) -> datetime:
        return datetime.strptime(folder_name, "%Y-%m-%d_%H-%M-%S")

    def search_invoices_by_date_range(self, empresa: str, fecha_inicio: datetime, fecha_fin: datetime) -> List[Dict[str, Any]]:
        resultados = []
        empresa_path = self.base_path / empresa
        if not empresa_path.exists():
            return resultados
        
        for date_folder in empresa_path.iterdir():
            if date_folder.is_dir() and self._is_valid_date_folder(date_folder.name):
                folder_date = self._parse_date_folder_name(date_folder.name)
                if fecha_inicio <= folder_date <= fecha_fin:
                    factura_info = self.get_date_folder_contents(empresa, date_folder.name)
                    if factura_info:
                        resultados.append(factura_info)
        resultados.sort(key=lambda x: self._parse_date_folder_name(x["carpeta_fecha"]), reverse=True)
        return resultados
    def _parse_datetime(self, date_value: Any) -> datetime:
        if isinstance(date_value, datetime):
            return date_value
        
        if not date_value:
            return datetime.now()
        
        date_str = str(date_value).strip()
        
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
        
        print(f"⚠️ No se pudo parsear la fecha: {date_str}, usando fecha actual")
        return datetime.now()

    def delete_invoice(self, empresa: str, fecha_carpeta: str) -> Dict[str, Any]:
        try:
            folder_path = self.base_path / empresa / fecha_carpeta
            if not folder_path.exists():
                return {"success": False, "error": "Carpeta no encontrada"}
            shutil.rmtree(folder_path)    
            return {
                "success": True,
                "mensaje": f"Factura {fecha_carpeta} eliminada correctamente",
                "empresa": empresa,
                "carpeta_eliminada": fecha_carpeta
            }
            
        except Exception as e:
            print(f"❌ Error eliminando factura: {e}")
            return {"success": False, "error": str(e)}