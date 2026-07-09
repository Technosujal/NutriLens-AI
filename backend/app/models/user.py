from sqlalchemy import Column, Integer, String, Float, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    
    # Profile & Health Goals
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    target_weight_kg = Column(Float, nullable=True)
    activity_level = Column(String, nullable=True)  # Sedentary, Lightly Active, Moderately Active, Very Active
    weight_goal = Column(String, nullable=True)     # Lose Weight, Maintain Weight, Gain Muscle
    diet_preference = Column(String, nullable=True) # Vegetarian, Non-Vegetarian, etc.
    
    # Calculated Goals
    calorie_goal = Column(Integer, nullable=True)
    protein_goal_g = Column(Integer, nullable=True)
    carbs_goal_g = Column(Integer, nullable=True)
    fat_goal_g = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    meals = relationship("Meal", back_populates="user", cascade="all, delete-orphan")
    water_logs = relationship("WaterLog", back_populates="user", cascade="all, delete-orphan")
    weight_history = relationship("WeightHistory", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
