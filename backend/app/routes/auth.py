import logging
from typing import Optional
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    GoogleAuthRequest,
    GithubAuthRequest,
    DemoAuthRequest,
    Token,
    UserResponse
)
from app.utils.auth_utils import get_password_hash, verify_password, create_access_token
import uuid
import json
import base64
import httpx

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

def _decode_jwt_payload_unverified(jwt_token: str) -> dict:
    """Helper to extract unverified claims from Google ID Token."""
    try:
        parts = jwt_token.split(".")
        if len(parts) >= 2:
            payload_b64 = parts[1]
            # Add padding
            rem = len(payload_b64) % 4
            if rem > 0:
                payload_b64 += "=" * (4 - rem)
            decoded_bytes = base64.urlsafe_b64decode(payload_b64)
            return json.loads(decoded_bytes.decode("utf-8"))
    except Exception as e:
        logger.warning(f"Failed to decode JWT payload: {e}")
    return {}

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    logger.info(f"Signup request for email: {payload.email}")
    # Check if user already exists
    clean_email = str(payload.email).strip().lower()
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        logger.warning(f"Signup failed: email {payload.email} already exists.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
        
    hashed_password = get_password_hash(payload.password)
    new_user = User(
        email=clean_email,
        hashed_password=hashed_password,
        name=payload.name,
        auth_provider="email"
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"User {clean_email} created successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during user creation for {clean_email}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during account creation."
        )
        
    access_token = create_access_token(data={"sub": new_user.email, "user_id": new_user.id})
    logger.info(f"Token generated for user {clean_email}.")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "avatar_url": getattr(new_user, "avatar_url", None),
            "auth_provider": "email"
        }
    }

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    clean_email = str(payload.email).strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": getattr(user, "avatar_url", None),
            "auth_provider": getattr(user, "auth_provider", "email") or "email"
        }
    }

@router.post("/google-auth", response_model=Token)
@router.post("/auth/google", response_model=Token)
async def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate or Register user with Google SSO / ID Token.
    """
    email = payload.email
    name = payload.name
    picture = payload.picture

    # If Google credential / ID token is provided
    id_token = payload.credential or payload.token
    if id_token:
        # Try to verify via Google tokeninfo endpoint
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}")
                if res.status_code == 200:
                    info = res.json()
                    email = info.get("email") or email
                    name = info.get("name") or name
                    picture = info.get("picture") or picture
                else:
                    # Fallback to local JWT claims extraction
                    claims = _decode_jwt_payload_unverified(id_token)
                    email = claims.get("email") or email
                    name = claims.get("name") or name
                    picture = claims.get("picture") or picture
        except Exception as e:
            logger.warning(f"Google tokeninfo online check skipped: {e}")
            claims = _decode_jwt_payload_unverified(id_token)
            email = claims.get("email") or email
            name = claims.get("name") or name
            picture = claims.get("picture") or picture

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to determine email from Google sign-in."
        )

    clean_email = str(email).strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        # Create new user for Google SSO
        random_pwd = get_password_hash(f"google_sso_{uuid.uuid4()}")
        display_name = name or clean_email.split("@")[0].title()
        new_user = User(
            email=clean_email,
            name=display_name,
            hashed_password=random_pwd,
            avatar_url=picture,
            auth_provider="google"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user
        logger.info(f"Created new Google SSO user: {clean_email}")
    else:
        logger.info(f"Existing Google SSO user logged in: {clean_email}")
        updated = False
        if name and (not user.name or user.name == "Loading..."):
            user.name = name
            updated = True
        if picture and not user.avatar_url:
            user.avatar_url = picture
            updated = True
        if not user.auth_provider:
            user.auth_provider = "google"
            updated = True
        if updated:
            db.commit()

    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": getattr(user, "avatar_url", None),
            "auth_provider": "google"
        }
    }

@router.post("/github-auth", response_model=Token)
@router.post("/auth/github", response_model=Token)
async def github_auth(payload: GithubAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate or Register user with GitHub SSO / OAuth token.
    """
    email = payload.email
    name = payload.name
    avatar_url = payload.avatar_url

    # If an access token or OAuth code is passed
    if payload.token and not email:
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(
                    "https://api.github.com/user",
                    headers={"Authorization": f"token {payload.token}", "User-Agent": "NutriLens-AI"}
                )
                if res.status_code == 200:
                    gh_user = res.json()
                    name = gh_user.get("name") or gh_user.get("login") or name
                    avatar_url = gh_user.get("avatar_url") or avatar_url
                    email = gh_user.get("email")

                    # If email is private, fetch from emails endpoint
                    if not email:
                        email_res = await client.get(
                            "https://api.github.com/user/emails",
                            headers={"Authorization": f"token {payload.token}", "User-Agent": "NutriLens-AI"}
                        )
                        if email_res.status_code == 200:
                            emails = email_res.json()
                            primary = next((e["email"] for e in emails if e.get("primary")), None)
                            email = primary or (emails[0]["email"] if emails else None)
        except Exception as e:
            logger.warning(f"GitHub user info fetch error: {e}")

    if not email:
        # If GitHub email is private or demo GitHub login
        demo_handle = name.lower().replace(" ", "") if name else "github_user"
        email = f"{demo_handle}@users.noreply.github.com"

    clean_email = str(email).strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        random_pwd = get_password_hash(f"github_sso_{uuid.uuid4()}")
        display_name = name or clean_email.split("@")[0].title()
        new_user = User(
            email=clean_email,
            name=display_name,
            hashed_password=random_pwd,
            avatar_url=avatar_url,
            auth_provider="github"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user
        logger.info(f"Created new GitHub SSO user: {clean_email}")
    else:
        logger.info(f"Existing GitHub SSO user logged in: {clean_email}")
        updated = False
        if name and (not user.name or user.name == "Loading..."):
            user.name = name
            updated = True
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
            updated = True
        if not user.auth_provider:
            user.auth_provider = "github"
            updated = True
        if updated:
            db.commit()

    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": getattr(user, "avatar_url", None),
            "auth_provider": "github"
        }
    }

@router.post("/demo-auth", response_model=Token)
@router.post("/demo-login", response_model=Token)
@router.post("/auth/demo", response_model=Token)
def demo_auth(payload: Optional[DemoAuthRequest] = None, db: Session = Depends(get_db)):
    """
    Instantly create or log in as a pre-configured demo user with sample profile goals.
    """
    demo_email = "demo.athlete@nutrilens.ai"
    user = db.query(User).filter(User.email == demo_email).first()

    if not user:
        random_pwd = get_password_hash("NutriLensDemo2026!")
        user = User(
            email=demo_email,
            name="Alex Mercer (Demo Athlete)",
            hashed_password=random_pwd,
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            auth_provider="demo",
            age=26,
            gender="Male",
            height_cm=178.0,
            weight_kg=72.5,
            target_weight_kg=70.0,
            activity_level="Moderately Active",
            weight_goal="Lose Weight",
            diet_preference="Balanced",
            calorie_goal=2200,
            protein_goal_g=165,
            carbs_goal_g=245,
            fat_goal_g=60
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Initialized Demo User: {demo_email}")

    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": getattr(user, "avatar_url", None),
            "auth_provider": "demo"
        }
    }
