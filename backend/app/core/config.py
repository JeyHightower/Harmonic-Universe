"""Configuration settings for the application."""
from datetime import timedelta
import os
from typing import Optional

class Settings:
    """Application settings."""
    PROJECT_NAME: str = "Harmonic Universe"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # JWT Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    SQLALCHEMY_DATABASE_URI: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/harmonic_universe"
    )

    # CORS
    BACKEND_CORS_ORIGINS: list = ["*"]

    # Audio Processing
    AUDIO_UPLOAD_DIR: str = "uploads/audio"
    AUDIO_SAMPLE_RATE: int = 44100
    MAX_AUDIO_LENGTH: int = 600  # seconds

    # AI Service
    AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", "http://localhost:5001")
    AI_SERVICE_API_KEY: Optional[str] = os.getenv("AI_SERVICE_API_KEY")

settings = Settings()
