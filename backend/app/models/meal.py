from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, Date
from sqlalchemy.orm import relationship
from app.database import Base

class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meal_type = Column(String, nullable=False)  # Breakfast, Lunch, Dinner, Snacks
    name = Column(String, nullable=False)        # E.g., "Scrambled eggs and toast"
    date = Column(Date, index=True, nullable=False)
    
    # Nutrition totals for the meal
    total_calories = Column(Float, default=0.0)
    total_protein = Column(Float, default=0.0)
    total_carbs = Column(Float, default=0.0)
    total_fat = Column(Float, default=0.0)
    total_fiber = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="meals")
    items = relationship("MealItem", back_populates="meal", cascade="all, delete-orphan")


class MealItem(Base):
    __tablename__ = "meal_items"

    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id", ondelete="CASCADE"), nullable=False)
    food_name = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    serving_size = Column(String, nullable=True)  # E.g., "1 cup", "100g", "2 slices"
    
    # Nutritional content for this quantity
    calories = Column(Float, default=0.0)
    protein = Column(Float, default=0.0)
    carbs = Column(Float, default=0.0)
    fat = Column(Float, default=0.0)
    fiber = Column(Float, default=0.0)
    
    # Relationships
    meal = relationship("Meal", back_populates="items")


class NutritionCache(Base):
    __tablename__ = "nutrition_cache"

    id = Column(Integer, primary_key=True, index=True)
    food_name = Column(String, unique=True, index=True, nullable=False)
    calories = Column(Float, default=0.0)
    protein = Column(Float, default=0.0)
    carbs = Column(Float, default=0.0)
    fat = Column(Float, default=0.0)
    fiber = Column(Float, default=0.0)
    serving_size = Column(Float, default=100.0)
    serving_unit = Column(String, default="g")
    created_at = Column(DateTime, default=func.now())
