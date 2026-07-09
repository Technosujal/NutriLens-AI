from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.water import WaterLog
from app.schemas.water import WaterLogCreate, WaterLogResponse
from app.utils.auth_utils import get_current_user

router = APIRouter()

@router.post("", response_model=WaterLogResponse)
def log_water(payload: WaterLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Look for existing log on this date
    existing_log = db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.date == payload.date
    ).first()
    
    if existing_log:
        # Cumulative increment: support negative numbers for editing/adjusting
        existing_log.amount_ml = max(0, existing_log.amount_ml + payload.amount_ml)
        log_to_return = existing_log
    else:
        new_log = WaterLog(
            user_id=current_user.id,
            date=payload.date,
            amount_ml=max(0, payload.amount_ml)
        )
        db.add(new_log)
        log_to_return = new_log
        
    try:
        db.commit()
        db.refresh(log_to_return)
        return log_to_return
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record water log: " + str(e)
        )

@router.get("/{date}", response_model=WaterLogResponse)
def get_water_by_date(date: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(WaterLog).filter(
        WaterLog.user_id == current_user.id,
        WaterLog.date == date
    ).first()
    
    if not log:
        # Return a zeroed log representation (but don't write to DB until user interacts)
        return WaterLogResponse(
            id=0,
            user_id=current_user.id,
            date=date,
            amount_ml=0,
            created_at=current_user.created_at # mock timestamp
        )
    return log
