from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

# Import Database and Models to create tables
from app.database import engine, Base, get_db
from app.models import User, Meal, WaterLog, WeightHistory, Recommendation
from app.config import settings
from app.utils.auth_utils import get_current_user
from app.schemas.meal import MealResponse

# Import Route files
from app.routes import auth, profile, meal, water, dashboard, recommendation, rag_features

# Create Database tables
Base.metadata.create_all(bind=engine)

# Ensure new columns exist on database safely
def _ensure_db_columns():
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check database dialect
            dialect_name = engine.dialect.name
            if dialect_name == "postgresql":
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR DEFAULT 'email';"))
                conn.commit()
            elif dialect_name == "sqlite":
                columns = [row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
                if "avatar_url" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR"))
                if "auth_provider" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR DEFAULT 'email'"))
                conn.commit()
    except Exception as e:
        print("Schema sync check info:", e)

_ensure_db_columns()

app = FastAPI(title=settings.PROJECT_NAME)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root check
@app.get("/")
def read_root():
    return {"message": "CalorieAI API is running smoothly!"}

# Register API Routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(profile.router, prefix="/profile", tags=["Profile"])
app.include_router(meal.router, prefix="/meal", tags=["Meals"])
app.include_router(water.router, prefix="/water", tags=["Water Tracker"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(recommendation.router, prefix="/recommendations", tags=["AI Recommendations"])
app.include_router(rag_features.router, prefix="/rag", tags=["RAG Smart Features"])

# Alias route for GET /meals (matches the prompt requirements)
@app.get("/meals", response_model=List[MealResponse], tags=["Meals"])
def get_meals_alias(
    date: str = None, 
    query: str = None, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return meal.get_meals(date=date, query=query, db=db, current_user=current_user)

# Route for GET /history (returns full chronological log of meals, water, weight)
@app.get("/history", tags=["History"])
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all meals, water logs, and weight histories for user
    meals = db.query(Meal).filter(Meal.user_id == current_user.id).order_by(Meal.date.desc()).all()
    water = db.query(WaterLog).filter(WaterLog.user_id == current_user.id).order_by(WaterLog.date.desc()).all()
    weights = db.query(WeightHistory).filter(WeightHistory.user_id == current_user.id).order_by(WeightHistory.date.desc()).all()
    
    # Sort meals by date
    history_by_date = {}
    
    for m in meals:
        if m.date not in history_by_date:
            history_by_date[m.date] = {"meals": [], "water_ml": 0, "weight_kg": None}
        history_by_date[m.date]["meals"].append({
            "id": m.id,
            "meal_type": m.meal_type,
            "name": m.name,
            "total_calories": m.total_calories,
            "total_protein": m.total_protein,
            "total_carbs": m.total_carbs,
            "total_fat": m.total_fat,
            "total_fiber": m.total_fiber
        })
        
    for w in water:
        if w.date not in history_by_date:
            history_by_date[w.date] = {"meals": [], "water_ml": 0, "weight_kg": None}
        # Water is cumulative, sum it if multiple logs exist
        history_by_date[w.date]["water_ml"] += w.amount_ml
        
    for wt in weights:
        if wt.date not in history_by_date:
            history_by_date[wt.date] = {"meals": [], "water_ml": 0, "weight_kg": None}
        # Use the latest weight for that day
        if history_by_date[wt.date]["weight_kg"] is None:
            history_by_date[wt.date]["weight_kg"] = wt.weight_kg
            
    # Format and sort
    sorted_history = []
    for dt in sorted(history_by_date.keys(), reverse=True):
        day_info = history_by_date[dt]
        day_meals = day_info["meals"]
        sorted_history.append({
            "date": str(dt),
            "meals": day_meals,
            "water_ml": day_info["water_ml"],
            "weight_kg": day_info["weight_kg"],
            "total_calories": sum(m["total_calories"] for m in day_meals),
            "total_protein": sum(m["total_protein"] for m in day_meals),
            "total_carbs": sum(m["total_carbs"] for m in day_meals),
            "total_fat": sum(m["total_fat"] for m in day_meals)
        })
        
    return sorted_history
