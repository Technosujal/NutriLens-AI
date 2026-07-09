import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.user import User
from app.models.meal import Meal
from app.models.water import WaterLog
from app.models.weight import WeightHistory
from app.models.recommendation import Recommendation
from app.utils.auth_utils import get_current_user
from app.routes.profile import calculate_fitness_goals

router = APIRouter()

@router.get("")
def get_dashboard(date: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Parse/set today's date
    if not date:
        date = datetime.date.today().strftime("%Y-%m-%d")
        
    # 2. Get today's logged meals
    meals_today = db.query(Meal).filter(
        Meal.user_id == current_user.id,
        Meal.date == date
    ).all()
    
    # 3. Calculate today's totals
    cal_consumed = round(sum(m.total_calories for m in meals_today), 1)
    prot_consumed = round(sum(m.total_protein for m in meals_today), 1)
    carb_consumed = round(sum(m.total_carbs for m in meals_today), 1)
    fat_consumed = round(sum(m.total_fat for m in meals_today), 1)
    fiber_consumed = round(sum(m.total_fiber for m in meals_today), 1)
    
    # 4. User profile goals
    goals = calculate_fitness_goals(current_user)
    cal_goal = current_user.calorie_goal or 2000
    prot_goal = current_user.protein_goal_g or 150
    carb_goal = current_user.carbs_goal_g or 225
    fat_goal = current_user.fat_goal_g or 55
    
    # 5. Today's Water
    water_log = db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.date == date
    ).first()
    water_consumed = water_log.amount_ml if water_log else 0
    
    # 6. Weight progress
    weight_history_all = db.query(WeightHistory).filter(
        WeightHistory.user_id == current_user.id
    ).order_by(WeightHistory.date.asc()).all()
    
    current_weight = current_user.weight_kg or 0.0
    target_weight = current_user.target_weight_kg or 0.0
    initial_weight = weight_history_all[0].weight_kg if weight_history_all else current_weight
    
    # Weight progress percentage
    weight_progress_pct = 0.0
    if initial_weight != target_weight:
        # Distance remaining
        total_dist = abs(initial_weight - target_weight)
        if total_dist > 0:
            current_dist = abs(current_weight - target_weight)
            weight_progress_pct = round(max(0.0, min(100.0, ((total_dist - current_dist) / total_dist) * 100.0)), 1)
    elif current_weight == target_weight and target_weight > 0:
        weight_progress_pct = 100.0
        
    # 7. Compile last 7 days chart data (optimized)
    end_date = datetime.datetime.strptime(date, "%Y-%m-%d").date()
    start_date = end_date - datetime.timedelta(days=6)
    date_list = [(start_date + datetime.timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
    
    # Bulk fetch data for the 7-day period
    meals_weekly = db.query(Meal).filter(
        Meal.user_id == current_user.id,
        Meal.date >= start_date.strftime("%Y-%m-%d"),
        Meal.date <= end_date.strftime("%Y-%m-%d")
    ).all()
    
    water_weekly_logs = db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.date >= start_date.strftime("%Y-%m-%d"),
        WaterLog.date <= end_date.strftime("%Y-%m-%d")
    ).all()
    
    # Process data in memory for quick lookups
    daily_calories = {d: 0 for d in date_list}
    daily_protein = {d: 0 for d in date_list}
    for meal in meals_weekly:
        daily_calories[meal.date] = daily_calories.get(meal.date, 0) + meal.total_calories
        daily_protein[meal.date] = daily_protein.get(meal.date, 0) + meal.total_protein
        
    daily_water = {log.date: log.amount_ml for log in water_weekly_logs}

    # Build chart data
    weekly_calories = []
    weekly_protein = []
    weekly_water = []
    
    for d in date_list:
        day_name = datetime.datetime.strptime(d, "%Y-%m-%d").strftime("%a")
        weekly_calories.append({"date": d, "day": day_name, "calories": round(daily_calories.get(d, 0), 1)})
        weekly_protein.append({"date": d, "day": day_name, "protein": round(daily_protein.get(d, 0), 1)})
        weekly_water.append({"date": d, "day": day_name, "water": daily_water.get(d, 0)})

    # Weight Trend (Optimized)
    # Fetch all weight logs and create a lookup map
    all_weight_logs = db.query(WeightHistory).filter(
        WeightHistory.user_id == current_user.id
    ).order_by(WeightHistory.date.asc()).all()
    
    weight_map = {log.date: log.weight_kg for log in all_weight_logs}
    
    weight_trend = []
    last_known_weight = initial_weight
    
    for d in date_list:
        day_name = datetime.datetime.strptime(d, "%Y-%m-%d").strftime("%a")
        # Use today's weight if available, otherwise carry forward
        if d in weight_map:
            last_known_weight = weight_map[d]
        
        # Find the most recent weight on or before date 'd' from all logs
        # This is a bit inefficient in a loop, but better than a DB call.
        # For a more optimized approach, we could process all_weight_logs once.
        relevant_weight = initial_weight
        for log_date in sorted(weight_map.keys()):
            if log_date <= d:
                relevant_weight = weight_map[log_date]
            else:
                break
        
        weight_trend.append({"date": d, "day": day_name, "weight": relevant_weight})
        
    # 8. Today's Recommendation
    rec_today = db.query(Recommendation).filter(
        Recommendation.user_id == current_user.id,
        Recommendation.date == date
    ).first()
    
    recommendation_data = None
    if rec_today:
        try:
            import json
            recommendation_data = json.loads(rec_today.recommendation_text)
        except Exception:
            recommendation_data = rec_today.recommendation_text
    return {
        "today_summary": {
            "calories_consumed": cal_consumed,
            "calories_goal": cal_goal,
            "calories_remaining": max(0, int(cal_goal - cal_consumed)),
            "protein_consumed": prot_consumed,
            "protein_goal": prot_goal,
            "carbs_consumed": carb_consumed,
            "carbs_goal": carb_goal,
            "fat_consumed": fat_consumed,
            "fat_goal": fat_goal,
            "fiber_consumed": fiber_consumed,
            "profile_complete": goals is not None
        },
        "water_summary": {
            "amount_ml": water_consumed,
            "goal_ml": 4000,
            "progress_pct": round(min(100.0, (water_consumed / 4000.0) * 100.0), 1)
        },
        "weight_summary": {
            "current_weight": current_weight,
            "target_weight": target_weight,
            "initial_weight": initial_weight,
            "progress_pct": weight_progress_pct
        },
        "charts": {
            "weekly_calories": weekly_calories,
            "weekly_protein": weekly_protein,
            "weekly_water": weekly_water,
            "weight_trend": weight_trend
        },
        "today_meals": [
            {
                "id": m.id,
                "meal_type": m.meal_type,
                "name": m.name,
                "total_calories": m.total_calories,
                "total_protein": m.total_protein,
                "total_carbs": m.total_carbs,
                "total_fat": m.total_fat,
                "total_fiber": m.total_fiber,
                "time": m.created_at.strftime("%H:%M")
            } for m in meals_today
        ],
        "latest_recommendation": recommendation_data
    }
