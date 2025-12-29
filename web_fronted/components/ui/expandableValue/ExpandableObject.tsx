'use client';

import { useState } from 'react';
import { EditableField } from './EditableField';
import { ExpandableValue } from './ExpandableValue';
import { formatFactureHolder } from '@/lib/utils';

interface ExpandableObjectProps {
  value: Record<string, any>;
  label: string;
  depth?: number;
  onValueChange?: (newValue: any) => void;
  factureType?: string;
}

type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'array' | 'object';

interface FieldTypeOption {
  value: FieldType;
  label: string;
  icon: string;
  description: string;
  defaultValue: any;
}

export const ExpandableObject = ({ value, label, depth = 0, onValueChange, factureType = '' }: ExpandableObjectProps) => {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const [newFieldName, setNewFieldName] = useState('');
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>('string');
  const [isAddingField, setIsAddingField] = useState(false);

  const keys = Object.keys(value);

  const fieldTypeOptions: FieldTypeOption[] = [
    {
      value: 'string',
      label: 'Texto',
      icon: '📝',
      description: 'Texto libre',
      defaultValue: 'Nuevo valor'
    },
    {
      value: 'number',
      label: 'Número',
      icon: '🔢',
      description: 'Valor numérico',
      defaultValue: 0
    },
    {
      value: 'boolean',
      label: 'Verdadero/Falso',
      icon: '✅',
      description: 'Valor booleano',
      defaultValue: false
    },
    {
      value: 'date',
      label: 'Fecha',
      icon: '📅',
      description: 'Fecha sin hora',
      defaultValue: new Date().toISOString().split('T')[0]
    },
    {
      value: 'datetime',
      label: 'Fecha y Hora',
      icon: '⏰',
      description: 'Fecha con hora',
      defaultValue: new Date().toISOString()
    },
    {
      value: 'array',
      label: 'Lista',
      icon: '📋',
      description: 'Colección de elementos',
      defaultValue: []
    },
    {
      value: 'object',
      label: 'Objeto',
      icon: '📁',
      description: 'Estructura con propiedades',
      defaultValue: {}
    }
  ];

  const handleFieldChange = (fieldKey: string, newValue: any) => {
    const newObject = { ...value, [fieldKey]: newValue };
    if (onValueChange) {
      onValueChange(newObject);
    }
  };

  const handleAddField = () => {
    if (newFieldName.trim() && !value.hasOwnProperty(newFieldName)) {
      const selectedOption = fieldTypeOptions.find(opt => opt.value === selectedFieldType);
      const defaultValue = selectedOption ? selectedOption.defaultValue : '';
      
      const newObject = { ...value, [newFieldName.trim()]: defaultValue };
      if (onValueChange) {
        onValueChange(newObject);
      }
      setNewFieldName('');
      setSelectedFieldType('string');
      setIsAddingField(false);
    }
  };

  const handleRemoveField = (fieldKey: string) => {
    const { [fieldKey]: removed, ...newObject } = value;
    if (onValueChange) {
      onValueChange(newObject);
    }
  };

  const formatFieldName = (fieldName: string): string => {
    return formatFactureHolder(factureType, fieldName);
  };

  const getTypeColor = (type: FieldType) => {
    switch (type) {
      case 'string': return 'bg-green-100 text-green-600 border-green-200';
      case 'number': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'boolean': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'date': return 'bg-pink-100 text-pink-600 border-pink-200';
      case 'datetime': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'array': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'object': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden"
      style={{ 
        animationDelay: `${depth * 50}ms`,
        animation: 'fadeInUp 0.5s ease-out forwards'
      }}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 transform transition-transform ${
              isExpanded ? 'rotate-90' : ''
            } text-gray-400`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <span className="text-sm font-bold">O</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{formatFieldName(label)}</h3>
            <p className="text-xs text-gray-500">
              {keys.length} propiedad{keys.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            Objeto
          </span>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-3">
          {keys.map((key) => {
            const fieldValue = value[key];
            const isObject = typeof fieldValue === 'object' && fieldValue !== null && !Array.isArray(fieldValue);
            const isArray = Array.isArray(fieldValue);
            
            return (
              <div key={key} className="group relative flex items-start gap-2">
                <button
                  onClick={() => handleRemoveField(key)}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 hover:scale-110 flex-shrink-0 mt-3"
                  title="Eliminar campo"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  {isObject || isArray ? (
                    <ExpandableValue
                      value={fieldValue}
                      label={key}
                      depth={depth + 1}
                      onValueChange={(newValue) => handleFieldChange(key, newValue)}
                      factureType={factureType}
                    />
                  ) : (
                    <EditableField
                      label={key}
                      value={fieldValue}
                      onChange={(newValue) => handleFieldChange(key, newValue)}
                      factureType={factureType}
                      depth={depth + 1}
                    />
                  )}
                </div>
              </div>
            );
          })}
          {isAddingField ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 space-y-4">
              <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Nuevo Campo
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    📛 Nombre del Campo
                  </label>
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Ingresa el nombre del campo..."
                    className="w-full text-sm border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    🎯 Tipo de Dato
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {fieldTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedFieldType(option.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                          selectedFieldType === option.value
                            ? `${getTypeColor(option.value)} border-current scale-95 shadow-sm`
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{option.icon}</span>
                          <span className="font-medium text-sm">{option.label}</span>
                        </div>
                        <p className="text-xs text-gray-600">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    🎨 Vista Previa del Valor por Defecto:
                  </p>
                  <p className="text-sm text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded">
                    {(() => {
                      const selectedOption = fieldTypeOptions.find(opt => opt.value === selectedFieldType);
                      if (!selectedOption) return 'N/A';
                      
                      switch (selectedOption.value) {
                        case 'string':
                          return `"${selectedOption.defaultValue}"`;
                        case 'number':
                          return selectedOption.defaultValue;
                        case 'boolean':
                          return selectedOption.defaultValue ? 'true' : 'false';
                        case 'date':
                          return new Date(selectedOption.defaultValue).toLocaleDateString('es-ES');
                        case 'datetime':
                          return new Date(selectedOption.defaultValue).toLocaleString('es-ES');
                        case 'array':
                          return '[]';
                        case 'object':
                          return '{}';
                        default:
                          return selectedOption.defaultValue;
                      }
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddField}
                  disabled={!newFieldName.trim() || value.hasOwnProperty(newFieldName)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 justify-center shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Agregar Campo
                </button>
                <button
                  onClick={() => {
                    setIsAddingField(false);
                    setNewFieldName('');
                    setSelectedFieldType('string');
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg text-sm hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center gap-2 justify-center shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </button>
              </div>
              
              {value.hasOwnProperty(newFieldName) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-600 text-center">
                    ❌ Ya existe un campo con el nombre "{newFieldName}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAddingField(true)}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all duration-300 group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-left">
                <span className="font-medium text-sm block">Agregar nuevo campo</span>
                <span className="text-xs text-gray-500">Selecciona el tipo de dato</span>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};