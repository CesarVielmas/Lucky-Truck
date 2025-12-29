'use client';

import { useState } from 'react';
import { ExpandableValue } from './ExpandableValue';
import { EditableField } from './EditableField';
import { formatFactureHolder } from '@/lib/utils';

interface ExpandableArrayProps {
  value: any[];
  label: string;
  depth?: number;
  onValueChange?: (newValue: any) => void;
  factureType?: string;
}

export const ExpandableArray = ({ value, label, depth = 0, onValueChange, factureType = '' }: ExpandableArrayProps) => {
  const [isExpanded, setIsExpanded] = useState(depth === 0);

  const handleItemChange = (index: number, newValue: any) => {
    const newArray = [...value];
    newArray[index] = newValue;
    if (onValueChange) {
      onValueChange(newArray);
    }
  };

  const handleAddItem = () => {
    let newItem: any;
    
    if (value.length > 0) {
      const itemToDuplicate = value[value.length - 1];
      const deepCopy = (obj: any): any => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (Array.isArray(obj)) return obj.map(item => deepCopy(item));
        
        const copiedObj: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            copiedObj[key] = deepCopy(obj[key]);
          }
        }
        return copiedObj;
      };
      
      newItem = deepCopy(itemToDuplicate);
    } else {
      newItem = {
        id: Date.now(),
        nombre: 'Nuevo elemento',
        activo: true,
        fecha: new Date().toISOString().split('T')[0]
      };
    }
    
    const newArray = [...value, newItem];
    if (onValueChange) {
      onValueChange(newArray);
    }
  };

  const handleRemoveItem = (index: number) => {
    const newArray = value.filter((_, i) => i !== index);
    if (onValueChange) {
      onValueChange(newArray);
    }
  };

  const formatFieldName = (fieldName: string): string => {
    return formatFactureHolder(factureType, fieldName);
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
          <div className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">
            <span className="text-sm font-bold">A</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{formatFieldName(label)}</h3>
            <p className="text-xs text-gray-500">
              {value.length} elemento{value.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            Lista
          </span>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-3">
          {value.map((item, index) => {
            const isObject = typeof item === 'object' && item !== null && !Array.isArray(item);
            const isArray = Array.isArray(item);
            
            return (
              <div key={index} className="flex items-start gap-2 group">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index}
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 hover:scale-110"
                    title="Eliminar elemento"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  {isObject || isArray ? (
                    <ExpandableValue
                      value={item}
                      label={`Elemento ${index}`}
                      depth={depth + 1}
                      onValueChange={(newValue) => handleItemChange(index, newValue)}
                      factureType={factureType}
                    />
                  ) : (
                    <EditableField
                      label={`Elemento ${index}`}
                      value={item}
                      onChange={(newValue) => handleItemChange(index, newValue)}
                      factureType={factureType}
                      depth={depth + 1}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <div className="pt-2">
            <button
              onClick={handleAddItem}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 text-gray-600 hover:text-green-600 transition-all duration-300 group"
            >
              <div className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-medium text-sm">
                {value.length > 0 ? 'Duplicar último elemento' : 'Agregar primer elemento'}
              </span>
            </button>
            {value.length > 0 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Se duplicará el último elemento con todos sus valores y tipos
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};