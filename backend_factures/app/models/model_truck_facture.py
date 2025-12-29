from pydantic import BaseModel, Field, ConfigDict, field_validator
from decimal import Decimal
from typing import Dict, Optional, List
from datetime import datetime

class FactureTrip(BaseModel):
    name_business : str
    business_region : str
    business_ubication : str
    key : str
    code_facture : str
    type_material: str
    type_movement: str
    date_entry: datetime
    cuantity_bales: int
    container: int
    type_document: str
    date_exit: datetime
    proveedor : str
    name_transport : str
    name_operator : str
    plates : str
    ubication_trip : str
    gross_weight : float
    tare_weight : float    
    net_weight : float    
    not_suitable : float
    forbiden_weight : float
    humidity : float
    kg_desc_not_suitable : float
    kg_desc_forbiden : float
    kg_desc_humidity : float
    kg_desc_accepted_weight : float
    recibes_trip : datetime
