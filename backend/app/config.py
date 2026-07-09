import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "CalorieAI API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/calorie_ai")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeycalorieai12345!@#")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    USDA_API_KEY: str = os.getenv("USDA_API_KEY", "")
    
    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    class Config:
        case_sensitive = True

settings = Settings()
