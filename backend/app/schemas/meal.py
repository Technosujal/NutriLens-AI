from pydantic import BaseModel, Field
from datetime import date as date_type
from typing import Optional, List, Union

class MealItemBase(BaseModel):
    food_name: str
    quantity: float = 1.0
    serving_size: Optional[str] = None
    calories: float = 0.0
    protein: float = 0.0
    carbs: float = 0.0
    fat: float = 0.0
    fiber: float = 0.0

class MealItemCreate(MealItemBase):
    pass

class MealItemResponse(MealItemBase):
    id: int
    meal_id: int

    class Config:
        from_attributes = True

class MealCreate(BaseModel):
    meal_type: Optional[str] = Field(None, description="Breakfast, Lunch, Dinner, or Snacks")
    name: str = Field(..., description="Name of the meal log (e.g., Toast and Coffee)")
    date: Union[date_type, str] = Field(..., description="Log date in YYYY-MM-DD format")
    items: List[MealItemCreate] = []

class MealUpdate(BaseModel):
    meal_type: Optional[str] = None
    name: Optional[str] = None
    date: Optional[Union[date_type, str]] = None
    items: Optional[List[MealItemCreate]] = None

class MealResponse(BaseModel):
    id: int
    user_id: int
    meal_type: str
    name: str
    date: Union[date_type, str]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    items: List[MealItemResponse]

    class Config:
        from_attributes = True

class TextMealLoggingRequest(BaseModel):
    text: str
    date: Union[date_type, str]  # YYYY-MM-DD
    meal_type: Optional[str] = None # Breakfast, Lunch, Dinner, Snacks

class VoiceMealLoggingRequest(BaseModel):
    text: str
    date: Union[date_type, str]
    meal_type: Optional[str] = None

