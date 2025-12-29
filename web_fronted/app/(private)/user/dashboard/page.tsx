"use client"

import { InputText } from "@/components/forms/inputText";
import { Fragment } from "@/components/ui/fragment";
import { Tittle } from "@/components/ui/tittle";
import PhotoTool from "@/public/icons/photo_innactive.png";
import ExitPanel from "@/public/icons/exit.png";
import TakePhoto from "@/public/icons/take_photo_innactive.png";
import ImageArchive from "@/public/icons/image_archive_innactive.png";
import Help from "@/public/icons/help_innactive.png";
import WorkingProgress from "@/public/icons/working_progress_innactive.png";
import { useCallback, useEffect, useRef, useState } from "react";
import { CardTool } from "@/components/ui/card_tool";
import Image from "next/image";
import { FactureWeekend } from "@/models/FactureWeekend";
import { FactureTrip } from "@/models/FactureTrip";
import { SecureFetchResponse, useSecureFetch } from "@/hooks/useSecurePetitionApi";
import { ExpandableValue } from "../../../../components/ui/expandableValue/ExpandableValue";
import { ZoomImage } from "@/components/ui/zoomImage";

type AnyFacture = FactureWeekend | FactureTrip;
type FactureType = 'facture_weekend' | 'facture_trip';
interface FactureData {
  tipo_factura: FactureType;
  objeto_factura: AnyFacture;
  paths_archives : string[];
}

export default function UserDashboard() {
  
  const [search,setSearch] = useState("");
  const [takePhoto,setTakePhoto] = useState(false);
  const [facture,setFacture] = useState<FactureData | null>(null);
  const [verifyData,setVerifyData] = useState(false);
  const [actualImage,setActualImage] = useState(1);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewImage, setViewImage] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [processError, setProcessError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { fetchSecure, loading, error, progress, clear,cancel } = useSecureFetch();
  
  const handleSearch = (e : React.ChangeEvent) =>{
    if(e.target){
      const value : string = (e.target as HTMLInputElement).value;
      setSearch(value);
    }
  };
  const clickPhoto = () =>{
    setTakePhoto(!takePhoto);
    if(!takePhoto){
      clear();
      setProcessError(null);
      if(loading) cancel();
      setFacture(null);
      setVerifyData(false);
      setIsModified(false);
      setIsSaving(false);
      setSaveStatus('idle');
      setSaveMessage('');
      setActualImage(1); 
    }
  }
  const factorizeTypeFacture = (type : string) : string =>{
    if(type === 'facture_weekend') return 'Factura Semanal';
    if(type === 'facture_trip') return 'Factura De Viaje';
    else return 'Factura Desconocido';
  }
  const processFacture = async (files: File[]): Promise<SecureFetchResponse<FactureData>> => {
    if (!files || files.length === 0) {
      return {
        success: false,
        error: 'No se seleccionaron archivos'
      };
    }
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      return {
        success: false,
        error: 'Algunos archivos no son imágenes válidas'
      };
    }
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('images', file);
    });
    formData.append('enhance_ocr', 'true');
    formData.append('process_in_parallel', 'true');
    formData.append('download_enhanced', 'false');
    formData.append('limit_thinking_ai', '0');
    const metadata = {
      origen: 'user-dashboard',
      usuario: 'usuario_actual',
      timestamp: new Date().toISOString()
    };
    formData.append('metadata', JSON.stringify(metadata));
    const result = await fetchSecure<FactureData>('/factures', {
      method: 'POST',
      body: formData,
      contentType: 'form-data',
      timeout: 300000,
      retries: 2,
    });
    if (result.success && result.data) {
      const apiResponse = result.data as any;
      if (apiResponse.data.successful_results && apiResponse.data.successful_results.length > 0) {
        const firstResult = apiResponse.data.successful_results[0];
        const dataText = firstResult.data_text;
        const typeModel = firstResult.type_model;
        const factureData: FactureData = {
          tipo_factura: typeModel as FactureType,
          objeto_factura: dataText as AnyFacture,
          paths_archives: [firstResult.path_json_text,firstResult.path_enhanced_image,firstResult.path_original_image]
        };
        setFacture(factureData);
        setTimeout(()=>{
          setVerifyData(true);
        },3000);
      }
      else result.success = false;
    }
    return result;
  };
  const normalizeDirectoryPath = (urlOrPath: string): string => {
    let path: string;
    if (urlOrPath.includes('://')) {
      try {
        const url = new URL(urlOrPath);
        path = url.pathname;
      } catch {
        path = urlOrPath;
      }
    } else {
      path = urlOrPath;
    }
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    const lastSlashIndex = path.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const lastSegment = path.substring(lastSlashIndex + 1);
      if (lastSegment.includes('.') || 
          lastSegment === 'factura.json' || 
          lastSegment.endsWith('.json')) {
        path = path.substring(0, lastSlashIndex);
      }
    }
    
    return path;
  }
  const handleSave = async () => {
    if (!isModified) {
      setTakePhoto(false);
      setVerifyData(false);
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    setSaveMessage('');
    try {
      if(!facture) throw new Error('No hay factura para guardar');
      const pathDir = normalizeDirectoryPath(facture.paths_archives[0]);
      console.log(facture.objeto_factura);
      const payloadResponse = {
        path_dir: pathDir,
        model_type: facture.tipo_factura,
        corrected_data: facture.objeto_factura,
      }
      const response = await fetchSecure('/factures', {
        method: 'PUT',
        body: payloadResponse,
        contentType: 'json',
        timeout: 300000,
        retries: 2
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al guardar y editar la factura');
      }
      setSaveStatus('success');
      setSaveMessage('¡Datos guardados con éxito!');
      setIsModified(false);
      setTimeout(() => {
        setTakePhoto(false);
        setIsSaving(false);
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : 'Error desconocido al guardar');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isModified) {
      if (window.confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
        setTakePhoto(false);
        setVerifyData(false);
        setIsModified(false);
      }
    } else {
      setTakePhoto(false);
      setVerifyData(false);
    }
  };
  const handleFilePhoto = async (e: React.ChangeEvent<HTMLInputElement>) =>{
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setProcessError(null);
    const result = await processFacture(files);
    if (result.success) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      const dataAny: any = (result as any).data ?? undefined;
      const failed = dataAny?.failed_results ?? dataAny?.data?.failed_results;
      const firstFailed = Array.isArray(failed) && failed.length > 0 ? failed[0] : null;
      const firstErrorMsg =
        firstFailed?.error ??
        firstFailed?.message ??
        (firstFailed ? JSON.stringify(firstFailed) : null);
      const finalError = result.error ?? firstErrorMsg ?? 'Error desconocido al procesar factura';
      setProcessError(finalError);
      
    }
  }
  const handleRetry = () => {
    clear();
    setProcessError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click(); 
    }
  };
  const updateModalStyles = useCallback(() => {
    if (modalRef.current) {
      const modal = modalRef.current;
      if (verifyData) {
        modal.classList.remove('h-5/11', 'w-6/10');
        modal.classList.add('h-8/11', 'w-10/11');
      } else {
        modal.classList.remove('h-8/11', 'w-10/11');
        modal.classList.add('h-5/11', 'w-6/10');
      }
    }
  }, [verifyData]);

  useEffect(() => {
    updateModalStyles();
  }, [verifyData, updateModalStyles]);
  const displayError = error || processError;
  return (
    <Fragment className="relative flex flex-col h-full w-full p-5 gap-y-3" variant="invisibly">
      {viewImage && facture && (
        <div className="flex absolute w-full h-full z-4 top-0 left-0 rounded-lg bg-black/30 justify-center items-center" onClick={()=>setViewImage(false)}>
          <div onClick={(e) => e.stopPropagation()} className="h-[95%] w-[70%] rounded-md">
            <ZoomImage
              src={facture.paths_archives[actualImage]}
              alt="zoom-image"
              zoom={2}
              minZoom={1}
              maxZoom={4}
              zoomStep={0.3}
              className="h-full w-full rounded-md"
              classImage="h-full w-full object-contain transition-all duration-300 ease-out rounded-md hover:cursor-zoom-in"
            />
          </div>
        </div>
      )}  
      <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFilePhoto} className="hidden" />
       {takePhoto && (
        <Fragment className="absolute flex justify-center items-center z-3 h-full w-full bg-black/60 top-0 left-0 " variant="invisibly" bordered="hight">
          <Fragment ref={modalRef} className={`relative flex flex-col h-5/11 w-6/10 transition-all duration-300 ease-out rounded-lg gap-10 p-5`} variant="default">
            <div 
              className="flex absolute h-2/10 w-1/10 transition-all duration-300 ease-out -right-10 -top-9 justify-center items-center hover:scale-120 hover:cursor-pointer" 
              onClick={clickPhoto}>
              <Image className="w-7/10 object-fill" src={ExitPanel} alt="logo-exit" />
            </div>
            <div className="flex flex-col h-full w-full">
              {loading && (
                <div className="flex flex-col items-center justify-center flex-1 w-full">
                  <div className="w-3/4 bg-gray-200 rounded-full h-4 mb-6">
                    <div 
                      className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <Tittle className='text-gray-600 mb-2' variant="hight" weight="semibold">
                    Procesando Factura...
                  </Tittle>
                  <p className="text-gray-500 text-center">
                    {progress < 30 && "Subiendo imágenes..."}
                    {progress >= 30 && progress < 70 && "Analizando contenido..."}
                    {progress >= 70 && "Finalizando procesamiento..."}
                  </p>
                  <p className="text-sm text-gray-400 mt-4">
                    {progress}% completado
                  </p>
                </div>
              )}
              
              {displayError && !loading && (
                <div className="flex flex-col items-center justify-center flex-1 w-full">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                  <Tittle className='text-red-600 mb-2' variant="hight" weight="semibold">
                    Error al Procesar
                  </Tittle>
                  <p className="text-gray-500 text-center mb-6 max-w-md">
                    {displayError}
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleRetry}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Reintentar
                    </button>
                    <button
                      onClick={clickPhoto}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}

              {facture && !loading && !displayError && !verifyData && (
                <div className="flex flex-col items-center justify-center flex-1 w-full">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <Tittle className='text-green-600 mb-2' variant="hight" weight="semibold">
                    ¡Factura Procesada!
                  </Tittle>
                  <p className="text-gray-500 text-center mb-6">
                    La factura se ha procesado correctamente.
                  </p>
                </div>
              )}
              {facture && !loading && !displayError && verifyData && (
                <div className="flex flex-col h-full">
                  <div className="flex flex-row items-center justify-center flex-1 w-full h-full gap-5 p-5 overflow-hidden">
                    <div className="flex relative flex-2 h-full w-full justify-center items-center rounded-sm overflow-hidden">
                      <img className="h-full w-full object-fill transition-all duration-300 ease-out  hover:cursor-pointer hover:opacity-50" src={facture.paths_archives[actualImage]} alt="actual-image-facture" onClick={()=>setViewImage(true)} />
                      <div className="flex flex-row absolute right-2 top-2 w-3/11 h-1/17 bg-gray-300 rounded-sm items-center justify-center gap-2 p-1">
                        <div className={`flex flex-1 w-full h-full justify-center items-center ${actualImage === 2 ? 'bg-gray-400' : ''} transition-all duration-300 ease-out hover:cursor-pointer hover:bg-gray-400 rounded-sm`} onClick={()=>setActualImage(2)}>
                          <p className={`${actualImage === 2 ? 'text-white' : 'text-gray-500'} hover:text-white font-sans font-small text-sm`}>Original</p>
                        </div>
                        <div className={`flex flex-1 w-full h-full justify-center items-center ${actualImage === 1 ? 'bg-gray-400' : ''} transition-all duration-300 ease-out hover:cursor-pointer hover:bg-gray-400 rounded-sm`} onClick={()=>setActualImage(1)}>
                          <p className={`${actualImage === 1 ? 'text-white' : 'text-gray-500'} hover:text-white font-sans font-small text-sm`}>Mejorada</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col flex-3 h-full w-full justify-center items-center">
                      <Tittle className='flex-1 text-gray-500 mb-2 text-center mt-0 mb-0' variant="hight" weight="semibold">
                        {factorizeTypeFacture(facture.tipo_factura)}
                      </Tittle>
                      <div className="flex-12 h-full w-full overflow-y-auto pr-2 custom-scrollbar">
                        <ExpandableValue 
                          value={facture.objeto_factura}
                          label="Datos de la Factura"
                          onValueChange={(newValue) => {
                            setFacture(prev => prev ? { ...prev, objeto_factura: newValue } : null);
                            if (!isModified) {
                              setIsModified(true);
                            }
                          }}
                          factureType={facture.tipo_factura}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isModified && (
                          <div className="flex items-center gap-2 text-amber-600">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">Cambios sin guardar</span>
                          </div>
                        )}
                        
                        {saveStatus === 'success' && (
                          <div className="flex items-center gap-2 text-green-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span className="text-sm font-medium">{saveMessage}</span>
                          </div>
                        )}
                        
                        {saveStatus === 'error' && (
                          <div className="flex items-center gap-2 text-red-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            <span className="text-sm font-medium">{saveMessage}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                        >
                          Cancelar
                        </button>

                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className={`
                            px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 
                            flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed
                            ${isModified 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl' 
                              : 'bg-green-500 hover:bg-green-600 shadow-md hover:shadow-lg'
                            }
                          `}
                        >
                          {isSaving ? (
                            <>
                              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                              </svg>
                              <span>Guardando...</span>
                            </>
                          ) : isModified ? (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                              </svg>
                              <span>Modificar y Guardar</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                              <span>Guardar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {!loading && !displayError && !facture && (
                <>
                  <div className="flex flex-1 h-full w-full flex-row justify-center items-center">
                    <Tittle className='flex-2 text-gray-500 tracking-normal mt-4 text-end' variant="hight" weight="light">
                      Seleccione La Opción
                    </Tittle>
                    <div className="flex flex-1 overflow-hidden h-full w-full justify-end items-center">
                      <Image 
                        className="w-2/12 mr-5 object-fill transition-all duration-300 ease-out hover:cursor-pointer hover:scale-110 " 
                        src={Help} 
                        alt="logo-?" 
                      />
                    </div>
                  </div>
                  <div className="flex flex-6 h-full w-full flex-row gap-x-10">
                    <CardTool 
                      className="flex-1 h-full w-full" 
                      toolImage={ImageArchive} 
                      tittleTool="Subir Foto" 
                      shortDescription="Subir foto ya tomada para subir factura" 
                      onClick={() => fileInputRef.current?.click()} 
                    />
                    <CardTool 
                      className="flex-1 h-full w-full" 
                      toolImage={TakePhoto} 
                      tittleTool="Tomar Foto" 
                      shortDescription="Tomar nueva foto para subir factura" 
                      onClick={() => {
                        // Integrar Camara
                        alert('Funcionalidad de cámara en desarrollo');
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </Fragment>
        </Fragment> 
      )}
      <Fragment className="flex-1 flex flex-row w-full h-1/10 justify-center items-center" variant="invisibly">
        <Fragment className="flex-2 w-full h-9/10" variant="invisibly">
          <Tittle className='text-gray-500 tracking-normal ml-15 mt-0' variant="moreHight" weight="semibold">Panel Principal</Tittle>
          <Tittle className='text-gray-500 tracking-normal font-sans ml-15 mt-2' variant="small" weight="light">Seleccione alguna funcionalidad para realizar</Tittle>
        </Fragment>
        <Fragment className="flex-1 w-full h-full" variant="invisibly">
            <InputText className='bg-transparent focus:outline-none focus:ring-0 font-sans text-xl text-gray-400 font-medium placeholder-gray-400 pl-6 rounded-3xl border-gray-300 border-2 mt-2 h-8/11 w-full' containerClass="flex h-8/10 justify-center items-center" imageClass="top-4/13 h-5/10" bgColor='white' placeholder='Ingrese aqui la funcionalidad a buscar...' icon="search_gray" typeInput='text' value={search} onChangeFunction={handleSearch} />
        </Fragment>
      </Fragment>
      <Fragment className="flex flex-9 flex-wrap w-full h-full justify-center items-center gap-10 pt-5" variant="invisibly">
          <CardTool toolImage={PhotoTool} tittleTool="Tomar Factura" shortDescription="Haga click para guardar o tomar una factura" onClick={clickPhoto} listOptions={{"Ver detalles": () => console.log("Ver detalles")}} />
          <CardTool toolImage={WorkingProgress} tittleTool="Funcion En Desarrollo" shortDescription="Herramienta actualmente en desarrollo" listOptions={{"Ver detalles": () => console.log("Ver detalles")}} />
          <CardTool toolImage={WorkingProgress} tittleTool="Funcion En Desarrollo" shortDescription="Herramienta actualmente en desarrollo" listOptions={{"Ver detalles": () => console.log("Ver detalles")}} />
      </Fragment>
    </Fragment>
  );
}
