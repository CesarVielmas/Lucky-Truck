'use client';

import { useState, useEffect } from 'react';
import { formatFactureHolder } from '@/lib/utils';

interface EditableFieldProps {
  label: string;
  value: any;
  onChange: (newValue: any) => void;
  depth?: number;
  factureType?: string;
}

export const EditableField = ({ label, value, onChange, depth = 0, factureType = '' }: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [tempEditValue, setTempEditValue] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);
  const detectDate = (val: any) => {
    if (typeof val !== 'string') return { isDate: false, date: null };
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, 
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/, 
      /^\d{2}\/\d{2}\/\d{4}$/, 
      /^\d{2}-\d{2}-\d{4}$/, 
      /^\d{4}\/\d{2}\/\d{2}$/, 
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, 
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    ];

    const isDateString = datePatterns.some(pattern => pattern.test(val));
    if (!isDateString) return { isDate: false, date: null };
    let date: Date;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(val)) {
      const [datePart, timePart] = val.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      date = new Date(year, month - 1, day, hours, minutes);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [year, month, day] = val.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(val);
    }
    
    const isValidDate = !isNaN(date.getTime());
    
    return { 
      isDate: isValidDate, 
      date: isValidDate ? date : null,
      hasTime: isValidDate && (val.includes('T') || / \d{1,2}:\d{2}/.test(val)),
      format: isValidDate ? 'date' : 'text'
    };
  };

  const handleSave = () => {
    setIsEditing(false);
    
    let finalValue: any = tempEditValue;
    const dateInfo = detectDate(value);
    
    if (dateInfo.isDate) {
      if (dateInfo.hasTime) {
        const date = new Date(tempEditValue);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          
          finalValue = `${year}-${month}-${day} ${hours}:${minutes}`;
        }
      } else {
        const date = new Date(tempEditValue);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          finalValue = `${year}-${month}-${day}`;
        }
      }
    } else if (typeof value === 'number') {
      finalValue = Number(tempEditValue);
    } else if (typeof value === 'boolean') {
      finalValue = tempEditValue === 'true';
    }
    
    onChange(finalValue);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempEditValue('');
  };

  const getValueType = (value: any): string => {
    if (value === null || value === undefined) return 'vacío';
    if (Array.isArray(value)) return 'lista';
    if (typeof value === 'object') return 'objeto';
    if (typeof value === 'number') return 'número';
    if (typeof value === 'boolean') return 'booleano';
    
    const dateInfo = detectDate(value);
    if (dateInfo.isDate) return 'fecha';
    
    return 'texto';
  };

  const getValueStatus = (value: any): string => {
    if (value === null || value === undefined) return 'No disponible';
    if (value === '') return 'Texto vacío';
    if (Array.isArray(value) && value.length === 0) return 'Lista vacía';
    if (Array.isArray(value) && value.length > 0) return 'Lista con elementos';
    if (typeof value === 'object') return 'Objeto con elementos';
    if (typeof value === 'number' && value < 0) return 'Valor negativo';
    if (typeof value === 'number' && value === 0) return 'Valor cero';
    if (typeof value === 'number' && value > 0) return 'Valor positivo';
    if (typeof value === 'boolean' && value) return 'Verdadero';
    if (typeof value === 'boolean' && !value) return 'Falso';
    
    const dateInfo = detectDate(value);
    if (dateInfo.isDate) {
      return dateInfo.hasTime ? 'Fecha con hora' : 'Fecha';
    }
    
    return 'Dato válido';
  };

  const formatFieldName = (fieldName: string): string => {
    return formatFactureHolder(factureType, fieldName);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'número': return 'bg-blue-100 text-blue-600';
      case 'texto': return 'bg-green-100 text-green-600';
      case 'booleano': return 'bg-purple-100 text-purple-600';
      case 'lista': return 'bg-yellow-100 text-yellow-600';
      case 'objeto': return 'bg-indigo-100 text-indigo-600';
      case 'fecha': return 'bg-pink-100 text-pink-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    const dateInfo = detectDate(dateString);
    if (!dateInfo.isDate || !dateInfo.date) return dateString;

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    if (dateInfo.hasTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    try {
      return dateInfo.date.toLocaleDateString('es-ES', options);
    } catch (error) {
      return dateString;
    }
  };

  const formatDateForInput = (dateString: string) => {
    const dateInfo = detectDate(dateString);
    if (!dateInfo.isDate || !dateInfo.date) return '';

    try {
      if (dateInfo.hasTime) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } else {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      return dateString;
    }
  };

  const startEditing = () => {
    const dateInfo = detectDate(value);
    if (dateInfo.isDate) {
      setTempEditValue(formatDateForInput(value));
    } else if (typeof value === 'boolean') {
      setTempEditValue(value.toString());
    } else {
      setTempEditValue(value);
    }
    setIsEditing(true);
  };

  const renderValueDisplay = () => {
    if (value === null || value === undefined) {
      return (
        <span className="text-gray-400 italic text-sm">
          No disponible
        </span>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            value 
              ? 'bg-green-100 border-green-500 text-green-600' 
              : 'bg-red-100 border-red-500 text-red-600'
          }`}>
            {value ? '✓' : '✗'}
          </div>
          <span className={`font-semibold ${value ? 'text-green-600' : 'text-red-600'}`}>
            {value ? 'Sí' : 'No'}
          </span>
        </div>
      );
    }

    if (typeof value === 'number') {
      const isCurrency = label.toLowerCase().includes('precio') || 
                        label.toLowerCase().includes('costo') || 
                        label.toLowerCase().includes('total') ||
                        label.toLowerCase().includes('monto');
      
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-600">
            {isCurrency 
              ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'MXN' }).format(value)
              : new Intl.NumberFormat('es-ES').format(value)
            }
          </span>
          {isCurrency && (
            <span className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">Moneda</span>
          )}
        </div>
      );
    }

    if (typeof value === 'string') {
      const dateInfo = detectDate(value);
      
      if (dateInfo.isDate) {
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-pink-600 text-sm font-medium">
                {formatDateForDisplay(value)}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                {dateInfo.hasTime ? 'Incluye hora' : 'Solo fecha'}
              </span>
            </div>
          </div>
        );
      }

      if (value.length > 100) {
        return (
          <textarea
            readOnly
            value={value}
            className="w-full h-24 text-sm text-gray-700 bg-transparent border-none resize-none focus:outline-none leading-relaxed"
          />
        );
      }

      return (
        <span className="text-gray-700 text-sm font-medium leading-relaxed">
          {value}
        </span>
      );
    }

    return (
      <span className="text-gray-700 text-sm font-medium leading-relaxed">
        {String(value)}
      </span>
    );
  };

  const renderEditInput = () => {
    const dateInfo = detectDate(value);
    if (dateInfo.isDate) {
      const inputType = dateInfo.hasTime ? 'datetime-local' : 'date';
      const displayValue = tempEditValue || formatDateForInput(value);

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-2 font-medium">
                {dateInfo.hasTime ? 'Selecciona fecha y hora exacta' : 'Selecciona fecha exacta'}
              </label>
              <input
                type={inputType}
                value={displayValue}
                onChange={(e) => {
                  setTempEditValue(e.target.value);
                }}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                step={dateInfo.hasTime ? "1" : undefined}
              />
              <p className="text-xs text-gray-500 mt-2">
                {dateInfo.hasTime 
                  ? 'Se usará exactamente la fecha y hora que selecciones'
                  : 'Se usará exactamente la fecha que selecciones'
                }
              </p>
            </div>
          </div>
          {tempEditValue && (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
              <p className="text-xs text-pink-700 font-medium mb-1">Se guardará como:</p>
              <p className="text-sm text-pink-800 font-mono">
                {(() => {
                  try {
                    const previewDate = new Date(tempEditValue);
                    if (dateInfo.hasTime) {
                      const year = previewDate.getFullYear();
                      const month = String(previewDate.getMonth() + 1).padStart(2, '0');
                      const day = String(previewDate.getDate()).padStart(2, '0');
                      const hours = String(previewDate.getHours()).padStart(2, '0');
                      const minutes = String(previewDate.getMinutes()).padStart(2, '0');
                      return `${year}-${month}-${day} ${hours}:${minutes}`;
                    } else {
                      const year = previewDate.getFullYear();
                      const month = String(previewDate.getMonth() + 1).padStart(2, '0');
                      const day = String(previewDate.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    }
                  } catch (error) {
                    return tempEditValue;
                  }
                })()}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center gap-2 flex-1 justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Guardar Fecha
            </button>
            <button 
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors flex items-center gap-2 flex-1 justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              Cancelar
            </button>
          </div>
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center gap-3">
          <select 
            value={tempEditValue}
            onChange={(e) => setTempEditValue(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="true">Verdadero</option>
            <option value="false">Falso</option>
          </select>
          <div className="flex gap-2">
            <button 
              onClick={handleSave}
              className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
            >
              ✓
            </button>
            <button 
              onClick={handleCancel}
              className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              ✗
            </button>
          </div>
        </div>
      );
    }

    if (typeof value === 'number') {
      const isCurrency = label.toLowerCase().includes('precio') || 
                        label.toLowerCase().includes('costo') || 
                        label.toLowerCase().includes('total') ||
                        label.toLowerCase().includes('monto');
      return (
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={tempEditValue}
            onChange={(e) => setTempEditValue(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
            step={isCurrency ? "0.01" : "1"}
          />
          <div className="flex gap-2">
            <button 
              onClick={handleSave}
              className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
            >
              ✓
            </button>
            <button 
              onClick={handleCancel}
              className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              ✗
            </button>
          </div>
        </div>
      );
    }
    const isLongText = value && value.length > 100;
    return (
      <div className="space-y-3">
        {isLongText ? (
          <textarea
            value={tempEditValue}
            onChange={(e) => setTempEditValue(e.target.value)}
            className="w-full h-24 text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
        ) : (
          <input
            type="text"
            value={tempEditValue}
            onChange={(e) => setTempEditValue(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center gap-2 flex-1 justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Guardar
          </button>
          <button 
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors flex items-center gap-2 flex-1 justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  const valueType = getValueType(value);
  const isDateType = valueType === 'fecha';
  const dateInfo = detectDate(value);

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden ${
        depth > 0 ? 'scale-95' : ''
      }`}
      style={{ 
        animationDelay: `${depth * 50}ms`,
        animation: 'fadeInUp 0.5s ease-out forwards'
      }}
    >
      <div className={`${depth > 0 ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(valueType)}`}>
            {isDateType ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            ) : (
              <span className="text-sm font-bold">
                {formatFieldName(label).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-semibold text-gray-800 truncate">
              {formatFieldName(label)}
            </label>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(valueType)}`}>
                {valueType}
                {isDateType && dateInfo.hasTime && ' con hora'}
              </span>
              {getValueStatus(value) && (
                <span className="text-xs text-gray-500">
                  • {getValueStatus(value)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[60px]">
          {isEditing ? renderEditInput() : renderValueDisplay()}
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium">
            {label.toLowerCase()}
          </span>
          <div className="flex gap-1">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)); 
                setIsCopied(true);
              }}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isCopied 
                  ? 'text-green-500 bg-green-50' 
                  : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
              }`}
              title={isCopied ? "¡Copiado!" : "Copiar valor"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isCopied ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                )}
              </svg>
            </button>
            {!isEditing && (
              <button 
                onClick={startEditing}
                className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all duration-200"
                title="Editar campo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};