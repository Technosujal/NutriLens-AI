from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.weight import WeightHistory
from app.schemas.profile import ProfileUpdate, ProfileResponse
from app.utils.auth_utils import get_current_user

router = APIRouter()

def calculate_fitness_goals(user: User):
    """
    Utility function to calculate BMI, BMR, TDEE and daily nutrition goals based on user stats.
    """
    if not all([user.weight_kg, user.height_cm, user.age, user.gender, user.activity_level, user.weight_goal]):
        return None  # Profile incomplete
        
    # 1. BMI = weight (kg) / (height (m))^2
    height_m = user.height_cm / 100.0
    bmi = round(user.weight_kg / (height_m ** 2), 1) if height_m > 0 else 0.0
    
    # 2. BMR (Mifflin-St Jeor Equation)
    if user.gender.lower() == "male":
        bmr = 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age + 5
    else:  # female or other
        bmr = 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age - 161
    bmr = round(bmr, 1)
        
    # 3. TDEE
    activity_multipliers = {
        "sedentary": 1.2,
        "lightly active": 1.375,
        "moderately active": 1.55,
        "very active": 1.725
    }
    multiplier = activity_multipliers.get(user.activity_level.lower(), 1.2)
    tdee = round(bmr * multiplier, 1)
    
    # 4. Calorie Goal
    if user.weight_goal.lower() == "lose weight":
        calorie_goal = max(1200, int(tdee - 500))  # Don't drop below 1200 kcal for safety
    elif user.weight_goal.lower() == "gain muscle":
        calorie_goal = int(tdee + 300)
    else:  # maintain weight
        calorie_goal = int(tdee)
        
    # 5. Macros (30% Protein, 45% Carbs, 25% Fat)
    # 1g Protein = 4 kcal, 1g Carb = 4 kcal, 1g Fat = 9 kcal
    protein_goal_g = int((calorie_goal * 0.30) / 4)
    carbs_goal_g = int((calorie_goal * 0.45) / 4)
    fat_goal_g = int((calorie_goal * 0.25) / 9)
    
    return {
        "bmi": bmi,
        "bmr": bmr,
        "tdee": tdee,
        "calorie_goal": calorie_goal,
        "protein_goal_g": protein_goal_g,
        "carbs_goal_g": carbs_goal_g,
        "fat_goal_g": fat_goal_g
    }

@router.get("", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    goals = calculate_fitness_goals(current_user)
    
    response_data = {
        "name": current_user.name,
        "email": current_user.email,
        "avatar_url": getattr(current_user, "avatar_url", None),
        "auth_provider": getattr(current_user, "auth_provider", "email") or "email",
        "age": current_user.age,
        "gender": current_user.gender,
        "height_cm": current_user.height_cm,
        "weight_kg": current_user.weight_kg,
        "target_weight_kg": current_user.target_weight_kg,
        "activity_level": current_user.activity_level,
        "weight_goal": current_user.weight_goal,
        "diet_preference": current_user.diet_preference,
    }
    
    if goals:
        response_data.update(goals)
        
    return response_data

@router.put("", response_model=ProfileResponse)
def update_profile(payload: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    update_data = payload.dict(exclude_unset=True)
    
    # Update fields on user
    for key, value in update_data.items():
        setattr(current_user, key, value)
        
    # If weight is updated, append to WeightHistory table
    if "weight_kg" in update_data and update_data["weight_kg"] is not None:
        import datetime
        today_str = datetime.date.today().strftime("%Y-%m-%d")
        
        # Check if weight is already logged today, if so update, otherwise add new
        existing_weight_log = db.query(WeightHistory).filter(
            WeightHistory.user_id == current_user.id,
            WeightHistory.date == today_str
        ).first()
        
        if existing_weight_log:
            existing_weight_log.weight_kg = update_data["weight_kg"]
        else:
            weight_log = WeightHistory(
                user_id=current_user.id,
                weight_kg=update_data["weight_kg"],
                date=today_str
            )
            db.add(weight_log)
            
    # Calculate goals and cache them in the user table for ease of reference in recommendations
    goals = calculate_fitness_goals(current_user)
    if goals:
        current_user.calorie_goal = goals["calorie_goal"]
        current_user.protein_goal_g = goals["protein_goal_g"]
        current_user.carbs_goal_g = goals["carbs_goal_g"]
        current_user.fat_goal_g = goals["fat_goal_g"]
        
    try:
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update user profile: " + str(e)
        )
        
    response_data = {
        "name": current_user.name,
        "email": current_user.email,
        "avatar_url": getattr(current_user, "avatar_url", None),
        "auth_provider": getattr(current_user, "auth_provider", "email") or "email",
        "age": current_user.age,
        "gender": current_user.gender,
        "height_cm": current_user.height_cm,
        "weight_kg": current_user.weight_kg,
        "target_weight_kg": current_user.target_weight_kg,
        "activity_level": current_user.activity_level,
        "weight_goal": current_user.weight_goal,
        "diet_preference": current_user.diet_preference,
    }
    
    if goals:
        response_data.update(goals)
        
    return response_data
