from pydantic import BaseModel
from datetime import datetime

class WeightLogCreate(BaseModel):
    weight_kg: float
    date: str  # YYYY-MM-DD

class WeightLogResponse(BaseModel):
    id: int
    user_id: int
    date: str
    weight_kg: float
    created_at: datetime

    class Config:
        from_attributes = True
