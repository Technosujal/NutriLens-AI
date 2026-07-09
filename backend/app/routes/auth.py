import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest, Token, UserResponse
from app.utils.auth_utils import get_password_hash, verify_password, create_access_token

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    logger.info(f"Signup request for email: {payload.email}")
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == str(payload.email)).first()
    if existing_user:
        logger.warning(f"Signup failed: email {payload.email} already exists.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
        
    hashed_password = get_password_hash(payload.password)
    new_user = User(
        email=str(payload.email),
        hashed_password=hashed_password,
        name=payload.name
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"User {payload.email} created successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during user creation for {payload.email}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during account creation."
        )
        
    # Generate token immediately
    access_token = create_access_token(data={"sub": new_user.email, "user_id": new_user.id})
    logger.info(f"Token generated for user {payload.email}.")
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}
