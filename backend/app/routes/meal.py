import datetime
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.meal import Meal, MealItem, NutritionCache
from app.schemas.meal import (
    MealResponse, MealCreate, MealUpdate, 
    TextMealLoggingRequest, VoiceMealLoggingRequest
)
from app.services.gemini_service import GeminiService
from app.services.usda_service import get_or_create_nutrition
from app.utils.auth_utils import get_current_user
from app.utils.time_utils import get_meal_type_by_time

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

async def process_food_item(food_name: str, quantity: float, serving_size: Optional[str], db: Session) -> dict:
    """
    Looks up nutrition for a single food item using USDA database (cached)
    and falls back to Gemini estimations if USDA fails.
    """
    normalized_name = food_name.strip().lower()
    
    # 1. Search cached USDA or query USDA API
    nutrition = await get_or_create_nutrition(normalized_name, db)
    
    if nutrition:
        # Standard values in Cache are per 100g
        # Determine serving size in grams
        s_size = nutrition.serving_size if nutrition.serving_size and nutrition.serving_size > 0 else 100.0
        total_weight = quantity * s_size
        
        return {
            "food_name": food_name.strip(),
            "quantity": quantity,
            "serving_size": serving_size or f"{s_size} {nutrition.serving_unit}",
            "calories": round((nutrition.calories * total_weight) / 100.0, 1),
            "protein": round((nutrition.protein * total_weight) / 100.0, 1),
            "carbs": round((nutrition.carbs * total_weight) / 100.0, 1),
            "fat": round((nutrition.fat * total_weight) / 100.0, 1),
            "fiber": round((nutrition.fiber * total_weight) / 100.0, 1)
        }
    else:
        # 2. Fall back to Gemini estimation
        est = await GeminiService.estimate_food_nutrition(food_name, quantity, serving_size)
        
        # Save to cache as 100g base for future reference
        try:
            total_portion_weight = est.get("serving_size", 100.0)
            if total_portion_weight <= 0:
                total_portion_weight = 100.0
                
            calories_100 = (est["calories"] / total_portion_weight) * 100.0
            protein_100 = (est["protein"] / total_portion_weight) * 100.0
            carbs_100 = (est["carbs"] / total_portion_weight) * 100.0
            fat_100 = (est["fat"] / total_portion_weight) * 100.0
            fiber_100 = (est["fiber"] / total_portion_weight) * 100.0
            
            cache_item = NutritionCache(
                food_name=normalized_name,
                calories=round(calories_100, 1),
                protein=round(protein_100, 1),
                carbs=round(carbs_100, 1),
                fat=round(fat_100, 1),
                fiber=round(fiber_100, 1),
                serving_size=total_portion_weight,
                serving_unit=est.get("serving_unit", "g")
            )
            db.add(cache_item)
            db.commit()
        except Exception as cache_err:
            db.rollback()
            logger.error(f"Error caching Gemini nutrition estimates: {cache_err}")
            
        return {
            "food_name": food_name.strip(),
            "quantity": quantity,
            "serving_size": serving_size or f"{est.get('serving_size', 100.0)} {est.get('serving_unit', 'g')}",
            "calories": est["calories"],
            "protein": est["protein"],
            "carbs": est["carbs"],
            "fat": est["fat"],
            "fiber": est["fiber"]
        }

@router.post("/text", response_model=MealResponse)
async def log_meal_via_text(
    payload: TextMealLoggingRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Extract list of food items using Gemini
    items_extracted = await GeminiService.extract_foods_from_text(payload.text)
    
    if not items_extracted:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract any food items from the description."
        )
        
    meal_items_to_save = []
    total_cal = 0.0
    total_prot = 0.0
    total_car = 0.0
    total_f = 0.0
    total_fib = 0.0
    
    for item in items_extracted:
        food_name = item.get("food", "Unknown Food")
        quantity = float(item.get("quantity", 1.0))
        serving_size = item.get("serving_size")
        
        nutr = await process_food_item(food_name, quantity, serving_size, db)
        
        meal_item = MealItem(
            food_name=nutr["food_name"],
            quantity=nutr["quantity"],
            serving_size=nutr["serving_size"],
            calories=nutr["calories"],
            protein=nutr["protein"],
            carbs=nutr["carbs"],
            fat=nutr["fat"],
            fiber=nutr["fiber"]
        )
        meal_items_to_save.append(meal_item)
        
        total_cal += nutr["calories"]
        total_prot += nutr["protein"]
        total_car += nutr["carbs"]
        total_f += nutr["fat"]
        total_fib += nutr["fiber"]
        
    # Save the Meal
    new_meal = Meal(
        user_id=current_user.id,
        meal_type=get_meal_type_by_time(),
        name=payload.text[:100],  # Use user description as base name
        date=payload.date,
        total_calories=round(total_cal, 1),
        total_protein=round(total_prot, 1),
        total_carbs=round(total_car, 1),
        total_fat=round(total_f, 1),
        total_fiber=round(total_fib, 1)
    )
    
    try:
        db.add(new_meal)
        db.commit()
        db.refresh(new_meal)
        
        # Link items
        for mi in meal_items_to_save:
            mi.meal_id = new_meal.id
            db.add(mi)
        db.commit()
        db.refresh(new_meal)
        return new_meal
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log meal: " + str(e)
        )

@router.post("/voice", response_model=MealResponse)
async def log_meal_via_voice(
    payload: VoiceMealLoggingRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Same process as text route
    text_request = TextMealLoggingRequest(
        text=payload.text,
        date=payload.date
    )
    return await log_meal_via_text(text_request, db, current_user)

@router.post("/image", response_model=MealResponse)
async def log_meal_via_image(
    file: UploadFile = File(...),
    date: str = Form(...),
    meal_type: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    mime_type = file.content_type or "image/jpeg"
    
    # Process with Gemini Vision
    detected_items = await GeminiService.analyze_food_image(contents, mime_type)
    
    if not detected_items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Gemini Vision could not identify any food items in the image."
        )
        
    meal_items_to_save = []
    total_cal = 0.0
    total_prot = 0.0
    total_car = 0.0
    total_f = 0.0
    total_fib = 0.0
    
    for item in detected_items:
        food_name = item.get("food_name", "Identified Food")
        quantity = float(item.get("quantity", 1.0))
        serving_size = item.get("serving_size", "1 portion")
        
        # Take Gemini estimates directly or verify against USDA. 
        # The prompt instructed to estimate nutritional quantities directly from image. We use them directly.
        cal = float(item.get("calories", 0.0))
        prot = float(item.get("protein", 0.0))
        carbs = float(item.get("carbs", 0.0))
        fat = float(item.get("fat", 0.0))
        fiber = float(item.get("fiber", 0.0))
        
        meal_item = MealItem(
            food_name=food_name,
            quantity=quantity,
            serving_size=serving_size,
            calories=cal,
            protein=prot,
            carbs=carbs,
            fat=fat,
            fiber=fiber
        )
        meal_items_to_save.append(meal_item)
        
        total_cal += cal
        total_prot += prot
        total_car += carbs
        total_f += fat
        total_fib += fiber
        
    meal_name = "Image Log: " + ", ".join([mi.food_name for mi in meal_items_to_save[:3]])
    new_meal = Meal(
        user_id=current_user.id,
        meal_type=get_meal_type_by_time(),
        name=meal_name[:100],
        date=date,
        total_calories=round(total_cal, 1),
        total_protein=round(total_prot, 1),
        total_carbs=round(total_car, 1),
        total_fat=round(total_f, 1),
        total_fiber=round(total_fib, 1)
    )
    
    try:
        db.add(new_meal)
        db.commit()
        db.refresh(new_meal)
        
        for mi in meal_items_to_save:
            mi.meal_id = new_meal.id
            db.add(mi)
        db.commit()
        db.refresh(new_meal)
        return new_meal
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save image logged meal: " + str(e)
        )

@router.get("", response_model=List[MealResponse])
def get_meals(
    date: Optional[str] = None, 
    query: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    q = db.query(Meal).filter(Meal.user_id == current_user.id)
    
    if date:
        q = q.filter(Meal.date == date)
        
    if query:
        # Search in meal name or child food items
        q = q.join(MealItem).filter(
            (Meal.name.ilike(f"%{query}%")) | (MealItem.food_name.ilike(f"%{query}%"))
        ).distinct()
        
    # Sort by created time descending
    return q.order_by(Meal.created_at.desc()).all()

@router.delete("/{meal_id}", status_code=status.HTTP_200_OK)
def delete_meal(
    meal_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == current_user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found.")
        
    try:
        db.delete(meal)
        db.commit()
        return {"detail": "Meal log deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not delete meal log.")

@router.put("/{meal_id}", response_model=MealResponse)
def update_meal(
    meal_id: int, 
    payload: MealUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == current_user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found.")
        
    if payload.meal_type:
        meal.meal_type = payload.meal_type
    if payload.name:
        meal.name = payload.name
    if payload.date:
        meal.date = payload.date
        
    if payload.items is not None:
        # 1. Remove old items
        db.query(MealItem).filter(MealItem.meal_id == meal.id).delete()
        
        # 2. Add new items and re-calculate
        total_cal = 0.0
        total_prot = 0.0
        total_car = 0.0
        total_f = 0.0
        total_fib = 0.0
        
        for item in payload.items:
            mi = MealItem(
                meal_id=meal.id,
                food_name=item.food_name,
                quantity=item.quantity,
                serving_size=item.serving_size,
                calories=item.calories,
                protein=item.protein,
                carbs=item.carbs,
                fat=item.fat,
                fiber=item.fiber
            )
            db.add(mi)
            
            total_cal += item.calories * item.quantity
            total_prot += item.protein * item.quantity
            total_car += item.carbs * item.quantity
            total_f += item.fat * item.quantity
            total_fib += item.fiber * item.quantity
            
        meal.total_calories = round(total_cal, 1)
        meal.total_protein = round(total_prot, 1)
        meal.total_carbs = round(total_car, 1)
        meal.total_fat = round(total_f, 1)
        meal.total_fiber = round(total_fib, 1)
        
    try:
        db.commit()
        db.refresh(meal)
        return meal
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not update meal: " + str(e))
