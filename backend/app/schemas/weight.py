from pydantic import BaseModel
from datetime import datetime, date as date_type
from typing import Union

class WeightLogCreate(BaseModel):
    weight_kg: float
    date: Union[date_type, str]  # YYYY-MM-DD

class WeightLogResponse(BaseModel):
    id: int
    user_id: int
    date: Union[date_type, str]
    weight_kg: float
    created_at: datetime

    class Config:
        from_attributes = True

