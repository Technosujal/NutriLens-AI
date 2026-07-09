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

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
