from pydantic import BaseModel
from datetime import datetime

class WaterLogCreate(BaseModel):
    amount_ml: int
    date: str  # YYYY-MM-DD

class WaterLogResponse(BaseModel):
    id: int
    user_id: int
    date: str
    amount_ml: int
    created_at: datetime

    class Config:
        from_attributes = True
