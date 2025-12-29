export interface DutyOfConcept {
  duty: string;
  type_duty: string;
  base_import: string; 
  type_factor: string;
  rate_fee: string;
  import_with_fee_rate: string; 
}

export interface TripConcept {
  product_code: string;
  cuantity_trips: number;
  key_unit: string;
  type_unit: string;
  value_unit: string; 
  import_total: string;
  discount?: string;
  object_duty: boolean;
  description: string;
  dutys_of_concept: DutyOfConcept[];
}

export interface FactureWeekend {
  rfc_emisor: string;
  name_emisor: string;
  rfc_receptor: string;
  name_receptor: string;
  postal_code_receptor: string;
  tax_folio: string;
  no_csd: string;
  postal_code_emisor: string;
  datetime_emisor: string;
  concepts: TripConcept[];
  type_money: string;
  type_pay: string;
  method_pay: string;
  subtotal: string; 
  transferred_taxes: string;
  stoped_taxes: string;
  total: string;
  url_qr: string;
}