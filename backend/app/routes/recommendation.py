import datetime
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.meal import Meal
from app.models.recommendation import Recommendation
from app.services.gemini_service import GeminiService
from app.utils.auth_utils import get_current_user
from app.routes.profile import calculate_fitness_goals

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

@router.get("")
async def get_recommendations(
    diet_preference: str = Query("Non-Vegetarian", description="Vegetarian or Non-Vegetarian"),
    refresh: bool = Query(False, description="Force regeneration of recommendations"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    cache_key_date = f"{today_str}_{diet_preference.lower()}"
    
    # 1. If not forcing a refresh, check database cache for this specific diet preference
    if not refresh:
        existing_rec = db.query(Recommendation).filter(
            Recommendation.user_id == current_user.id,
            Recommendation.date == cache_key_date
        ).first()
        
        if existing_rec:
            try:
                return json.loads(existing_rec.recommendation_text)
            except Exception:
                return existing_rec.recommendation_text
                
    # 2. Gather context for Gemini Recommendation
    # Today's logged meals
    meals_today = db.query(Meal).filter(
        Meal.user_id == current_user.id,
        Meal.date == today_str
    ).all()
    
    cal_consumed = sum(m.total_calories for m in meals_today)
    prot_consumed = sum(m.total_protein for m in meals_today)
    carb_consumed = sum(m.total_carbs for m in meals_today)
    fat_consumed = sum(m.total_fat for m in meals_today)
    
    goals = calculate_fitness_goals(current_user)
    
    calorie_goal = current_user.calorie_goal or 2000
    protein_goal = current_user.protein_goal_g or 150
    carbs_goal = current_user.carbs_goal_g or 225
    fat_goal = current_user.fat_goal_g or 55
    
    calories_remaining = max(0.0, float(calorie_goal - cal_consumed))
    protein_remaining = max(0.0, float(protein_goal - prot_consumed))
    carbs_remaining = max(0.0, float(carbs_goal - carb_consumed))
    fat_remaining = max(0.0, float(fat_goal - fat_consumed))
    
    previous_meals = [
        {
            "meal_type": m.meal_type,
            "name": m.name,
            "calories": m.total_calories,
            "protein": m.total_protein,
            "carbs": m.total_carbs,
            "fat": m.total_fat
        } for m in meals_today
    ]
    
    # 3. Call Gemini
    recommendations_json = await GeminiService.get_meal_recommendations(
        user_name=current_user.name or "User",
        age=current_user.age or 30,
        gender=current_user.gender or "Male",
        weight=current_user.weight_kg or 70.0,
        target_weight=current_user.target_weight_kg or 70.0,
        weight_goal=current_user.weight_goal or "Maintain Weight",
        activity_level=current_user.activity_level or "Sedentary",
        calorie_goal=calorie_goal,
        calories_remaining=calories_remaining,
        protein_remaining=protein_remaining,
        carbs_remaining=carbs_remaining,
        fat_remaining=fat_remaining,
        diet_preference=diet_preference,
        previous_meals_today=previous_meals
    )

    # Post-validation: If vegetarian is requested, ensure no non-veg items slipped through
    if diet_preference.lower() == 'vegetarian' and isinstance(recommendations_json, dict):
        non_veg_keywords = ["chicken", "mutton", "beef", "pork", "fish", "salmon", "tuna", "prawn", "shrimp", "turkey", "bacon", "egg", "meat"]
        veg_fallbacks = {
            "breakfast": {
                "meal_name": "Tofu & Spinach Scramble with Toast",
                "description": "Crumbled firm tofu scrambled with fresh spinach, turmeric, and whole wheat toast.",
                "calories": 320, "protein": 22, "carbs": 24, "fat": 12, "is_suggestion": True,
                "explanation": "100% plant-based high-protein vegetarian breakfast."
            },
            "lunch": {
                "meal_name": "Quinoa & Chickpea Power Bowl",
                "description": "Vibrant bowl of fluffy quinoa, spiced chickpeas, cucumber, cherry tomatoes, and tahini.",
                "calories": 420, "protein": 18, "carbs": 58, "fat": 14, "is_suggestion": True,
                "explanation": "Balanced vegetarian power bowl rich in complex carbs and fiber."
            },
            "dinner": {
                "meal_name": "Grilled Paneer & Roasted Vegetables",
                "description": "Spiced cottage cheese cubes grilled with bell peppers, zucchini, and mint chutney.",
                "calories": 440, "protein": 26, "carbs": 22, "fat": 20, "is_suggestion": True,
                "explanation": "High-protein vegetarian dinner to aid muscle recovery."
            },
            "snacks": {
                "meal_name": "Greek Yogurt & Almond Bowl",
                "description": "Low-fat unsweetened Greek yogurt topped with sliced almonds and blueberries.",
                "calories": 220, "protein": 16, "carbs": 14, "fat": 8, "is_suggestion": True,
                "explanation": "Probiotic-rich vegetarian snack to curb hunger between meals."
            }
        }
        for meal_key in ["breakfast", "lunch", "dinner", "snacks"]:
            if meal_key in recommendations_json and isinstance(recommendations_json[meal_key], dict):
                m_name = (recommendations_json[meal_key].get("meal_name") or "").lower()
                m_desc = (recommendations_json[meal_key].get("description") or "").lower()
                if any(kw in m_name or kw in m_desc for kw in non_veg_keywords):
                    recommendations_json[meal_key] = veg_fallbacks[meal_key]
    
    # 4. Save/update cache in database
    try:
        # Check if recommendation exists for today to update it, or add new
        rec_record = db.query(Recommendation).filter(
            Recommendation.user_id == current_user.id,
            Recommendation.date == cache_key_date
        ).first()
        
        serialized_text = json.dumps(recommendations_json)
        
        if rec_record:
            rec_record.recommendation_text = serialized_text
        else:
            rec_record = Recommendation(
                user_id=current_user.id,
                date=cache_key_date,
                recommendation_text=serialized_text
            )
            db.add(rec_record)
            
        db.commit()
    except Exception as db_err:
        db.rollback()
        logger.error(f"Error caching meal recommendation: {db_err}")
        
    return recommendations_json
