from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    name: str = Field(..., min_length=2, description="Name must be at least 2 characters")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    token: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    picture: Optional[str] = None

class GithubAuthRequest(BaseModel):
    code: Optional[str] = None
    token: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class DemoAuthRequest(BaseModel):
    demo_type: Optional[str] = "standard"  # standard, athlete, weight_loss

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_provider: Optional[str] = "email"
    created_at: datetime

    class Config:
        from_attributes = True
