from pydantic import BaseModel
from datetime import datetime, date as date_type
from typing import Union

class WaterLogCreate(BaseModel):
    amount_ml: int
    date: Union[date_type, str]  # YYYY-MM-DD or date

class WaterLogResponse(BaseModel):
    id: int
    user_id: int
    date: Union[date_type, str]
    amount_ml: int
    created_at: datetime

    class Config:
        from_attributes = True

