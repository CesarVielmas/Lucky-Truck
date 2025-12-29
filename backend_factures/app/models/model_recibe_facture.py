from pydantic import BaseModel, Field, ConfigDict, field_validator
from decimal import Decimal
from typing import Optional, List
from datetime import datetime


class DutyOfConcept(BaseModel):
    duty: str
    type_duty: str
    base_import: Decimal
    type_factor: str
    rate_fee: str
    import_with_fee_rate: Decimal

    model_config = ConfigDict(arbitrary_types_allowed=True, json_encoders={Decimal: str})

    @field_validator('base_import', 'import_with_fee_rate', mode='before')
    def validate_decimal_values(cls, v):
        if isinstance(v, float):
            return Decimal(str(v))
        return v


class TripConcept(BaseModel):
    product_code: str
    cuantity_trips: int
    key_unit: str
    type_unit: str
    value_unit: Decimal
    import_total: Decimal
    discount: Optional[str] = None
    object_duty: bool
    description: str
    dutys_of_concept: List[DutyOfConcept]

    model_config = ConfigDict(arbitrary_types_allowed=True, json_encoders={Decimal: str})

    @field_validator('value_unit', 'import_total', mode='before')
    def validate_decimal_values(cls, v):
        if isinstance(v, float):
            return Decimal(str(v))
        return v


class FactureWeekend(BaseModel):
    rfc_emisor: str
    name_emisor: str
    rfc_receptor: str
    name_receptor: str
    postal_code_receptor: str
    tax_folio: str
    no_csd: str
    postal_code_emisor: str
    datetime_emisor: datetime
    concepts: List[TripConcept]
    type_money: str
    type_pay: str
    method_pay: str
    subtotal: Decimal
    transferred_taxes: Decimal
    stoped_taxes: Decimal
    total: Decimal
    url_qr: str

    model_config = ConfigDict(arbitrary_types_allowed=True, json_encoders={Decimal: str})

    @field_validator('subtotal', 'transferred_taxes', 'stoped_taxes', 'total', mode='before')
    def validate_decimal_values(cls, v):
        if isinstance(v, float):
            return Decimal(str(v))
        return v
