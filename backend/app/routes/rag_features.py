from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.utils.auth_utils import get_current_user
from app.services.rag_features_service import RAGFeaturesService

router = APIRouter()

class FoodSwapRequest(BaseModel):
    food_name: str
    calories: float
    protein: float
    fat: float

@router.get("/meal-finder")
async def get_smart_meal_finder(
    ingredients: Optional[str] = Query(None, description="Optional ingredient query (e.g. chicken, oats)"),
    diet_preference: Optional[str] = Query(None, description="Vegetarian or Non-Vegetarian"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    RAG-powered recipe & grocery meal finder matching the user's remaining calories and macros.
    """
    try:
        result = await RAGFeaturesService.smart_meal_finder(
            user=current_user,
            db=db,
            ingredients_query=ingredients,
            diet_preference=diet_preference
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run smart meal finder: {str(e)}"
        )

@router.get("/weekly-report")
async def get_weekly_rag_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a 7-day RAG health and diet summary report with tailored adherence insights.
    """
    try:
        report = await RAGFeaturesService.generate_weekly_report(user=current_user, db=db)
        return report
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate weekly report: {str(e)}"
        )

class ChatTurn(BaseModel):
    role: str
    content: str

class ChatMessageRequest(BaseModel):
    message: str
    chat_history: Optional[List[ChatTurn]] = None
    date: Optional[str] = None

class GroceryPlanRequest(BaseModel):
    diet_preference: Optional[str] = None
    days: Optional[int] = 5

class PlateAnalysisRequest(BaseModel):
    food_name: str
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    fiber: Optional[float] = None

@router.post("/coach-chat")
async def chat_with_ai_coach(
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Interactive Multi-Turn RAG Health & Nutrition Coach.
    Retrieves user history chunks, performs cosine similarity, and queries Gemini LLM.
    """
    try:
        history_dicts = [h.dict() for h in payload.chat_history] if payload.chat_history else None
        response = await RAGFeaturesService.chat_with_coach(
            query=payload.message,
            user=current_user,
            db=db,
            chat_history=history_dicts,
            target_date=payload.date
        )
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query AI Coach: {str(e)}"
        )

@router.post("/grocery-plan")
async def generate_grocery_plan(
    payload: Optional[GroceryPlanRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a smart, categorized grocery shopping list based on the user's diet and weekly goals.
    """
    try:
        diet_pref = payload.diet_preference if payload else None
        days = payload.days if payload and payload.days else 5
        plan = await RAGFeaturesService.generate_grocery_plan(
            user=current_user,
            db=db,
            diet_preference=diet_pref,
            days=days
        )
        return plan
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate grocery plan: {str(e)}"
        )

@router.post("/plate-analysis")
async def analyze_plate_health(
    payload: PlateAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Grades food nutrition quality, Glycemic Index (GI), and Ultra-Processed Food (UPF) risk.
    """
    try:
        analysis = await RAGFeaturesService.analyze_plate_health(
            food_name=payload.food_name,
            calories=payload.calories or 250,
            protein=payload.protein or 10,
            carbs=payload.carbs or 25,
            fat=payload.fat or 8,
            fiber=payload.fiber or 2
        )
        return analysis
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze plate health: {str(e)}"
        )
