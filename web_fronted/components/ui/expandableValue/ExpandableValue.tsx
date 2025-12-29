'use client';

import { ExpandableObject } from './ExpandableObject';
import { ExpandableArray } from './ExpandableArray';
import { EditableField } from './EditableField';

interface ExpandableValueProps {
  value: any;
  label: string;
  depth?: number;
  onValueChange?: (newValue: any) => void;
  factureType?: string;
}

export const ExpandableValue = ({ value, label, depth = 0, onValueChange, factureType = '' }: ExpandableValueProps) => {
  const maxDepth = 5;

  if (depth > maxDepth) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <span className="text-orange-600 text-sm">Profundidad máxima alcanzada</span>
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <ExpandableArray 
        value={value}
        label={label}
        depth={depth}
        onValueChange={onValueChange}
        factureType={factureType}
      />
    );
  }
  if (typeof value === 'object' && value !== null) {
    return (
      <ExpandableObject 
        value={value}
        label={label}
        depth={depth}
        onValueChange={onValueChange}
        factureType={factureType}
      />
    );
  }
  return (
    <EditableField 
      label={label}
      value={value}
      onChange={onValueChange || (() => {})}
      factureType={factureType}
    />
  );
};