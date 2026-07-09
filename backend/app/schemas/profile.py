from pydantic import BaseModel, Field
from typing import Optional

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[str] = Field(None, pattern="^(Male|Female|Other)$")
    height_cm: Optional[float] = Field(None, ge=50.0, le=250.0)
    weight_kg: Optional[float] = Field(None, ge=20.0, le=300.0)
    target_weight_kg: Optional[float] = Field(None, ge=20.0, le=300.0)
    activity_level: Optional[str] = Field(None, pattern="^(Sedentary|Lightly Active|Moderately Active|Very Active)$")
    weight_goal: Optional[str] = Field(None, pattern="^(Lose Weight|Maintain Weight|Gain Muscle)$")

class ProfileResponse(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    target_weight_kg: Optional[float] = None
    activity_level: Optional[str] = None
    weight_goal: Optional[str] = None
    
    # Calculated health targets
    bmi: Optional[float] = None
    bmr: Optional[float] = None
    tdee: Optional[float] = None
    calorie_goal: Optional[int] = None
    protein_goal_g: Optional[int] = None
    carbs_goal_g: Optional[int] = None
    fat_goal_g: Optional[int] = None

    class Config:
        from_attributes = True
