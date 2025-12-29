import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}
export function formatFactureHolder(type_facture : string , holder : string) : string{
  if(type_facture === 'facture_weekend'){
    const holderValue = {
      rfc_emisor: "RFC Emisor",
      name_emisor: "Nombre Emisor",
      rfc_receptor: "RFC Receptor",
      name_receptor: "Nombre Receptor",
      postal_code_receptor: "Código Postal Receptor",
      tax_folio: "Folio Fiscal",
      no_csd: "No. CSD",
      postal_code_emisor: "Código Postal Emisor",
      datetime_emisor: "Fecha y Hora de Emisión",
      concepts: "Conceptos",
      type_money: "Tipo de Moneda",
      type_pay: "Tipo de Pago",
      method_pay: "Método de Pago",
      subtotal: "Subtotal",
      transferred_taxes: "Impuestos Trasladados",
      stoped_taxes: "Impuestos Retenidos",
      total: "Total",
      url_qr: "URL Código QR",

      // TripConcept
      product_code: "Código de Producto",
      cuantity_trips: "Cantidad de Viajes",
      key_unit: "Clave de Unidad",
      type_unit: "Tipo de Unidad",
      value_unit: "Valor Unitario",
      import_total: "Importe Total",
      discount: "Descuento",
      object_duty: "Objeto del Impuesto",
      description: "Descripción",
      dutys_of_concept: "Impuestos del Concepto",

      // DutyOfConcept
      duty: "Impuesto",
      type_duty: "Tipo de Impuesto",
      base_import: "Base del Importe",
      type_factor: "Tipo de Factor",
      rate_fee: "Tasa o Cuota",
      import_with_fee_rate: "Importe con Tasa o Cuota",
    } as const;
    return translateHolderTrip(holder,holderValue);
  }
  else if (type_facture === 'facture_trip'){
    const holderValueTrip = {
      name_business: "Nombre de la Empresa",
      business_region: "Región de la Empresa",
      business_ubication: "Ubicación de la Empresa",
      key: "Clave",
      code_facture: "Código de Factura",
      type_material: "Tipo de Material",
      type_movement: "Tipo de Movimiento",
      date_entry: "Fecha de Entrada",
      cuantity_bales: "Cantidad de Pacas",
      container: "Contenedor",
      type_document: "Tipo de Documento",
      date_exit: "Fecha de Salida",
      proveedor: "Proveedor",
      name_transport: "Nombre del Transportista",
      name_operator: "Nombre del Operador",
      plates: "Placas",
      ubication_trip: "Ubicación del Viaje",
      gross_weight: "Peso Bruto",
      tare_weight: "Peso Tara",
      net_weight: "Peso Neto",
      not_suitable: "No Apto",
      forbiden_weight: "Peso Prohibido",
      humidity: "Humedad",
      kg_desc_not_suitable: "Kg Descontados por No Apto",
      kg_desc_forbiden: "Kg Descontados por Prohibido",
      kg_desc_humidity: "Kg Descontados por Humedad",
      kg_desc_accepted_weight: "Kg de Peso Aceptado",
      recibes_trip: "Recibe el Viaje",
    } as const;
    return translateHolderTrip(holder,holderValueTrip);
  }
  else 
    return ""
}
export const getDefaultValueByType = (exampleValue: any): any => {
  if (exampleValue === null || exampleValue === undefined) {
    return '';
  }
  if (Array.isArray(exampleValue)) {
    return [];
  }
  if (typeof exampleValue === 'object') {
    const newObj: any = {};
    Object.keys(exampleValue).forEach(key => {
      newObj[key] = getDefaultValueByType(exampleValue[key]);
    });
    return newObj;
  }
  switch (typeof exampleValue) {
    case 'string':
      if (detectDate(exampleValue).isDate) {
        const dateInfo = detectDate(exampleValue);
        if (dateInfo.hasTime) {
          return new Date().toISOString();
        } else {
          return new Date().toISOString().split('T')[0];
        }
      }
      if (exampleValue.includes('@') && exampleValue.includes('.')) {
        return 'nuevo@ejemplo.com';
      }
      return '';
    
    case 'number':
      if (exampleValue % 1 !== 0) {
        return 0.0;
      }
      return 0;
    
    case 'boolean':
      return false;
    
    default:
      return '';
  }
};
export const detectDate = (val: any) => {
  if (typeof val !== 'string') return { isDate: false, date: null };
  
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}-\d{2}-\d{4}$/,
    /^\d{4}\/\d{2}\/\d{2}$/,
  ];

  const isDateString = datePatterns.some(pattern => pattern.test(val));
  if (!isDateString) return { isDate: false, date: null };

  const date = new Date(val);
  const isValidDate = !isNaN(date.getTime());
  
  return { 
    isDate: isValidDate, 
    date: isValidDate ? date : null,
    hasTime: isValidDate && (val.includes('T') || /(\d{1,2}:\d{2})/.test(val))
  };
};
function translateHolderTrip(holder: string,holderValueTrip: Record<string, string>): string {
  if (holder in holderValueTrip) {
    return holderValueTrip[holder as keyof typeof holderValueTrip];
  }
  return "";
}