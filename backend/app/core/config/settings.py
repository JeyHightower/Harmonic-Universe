"""
Application settings configuration.
"""

from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    """Application settings."""
    # Project info
    PROJECT_NAME: str = "Harmonic Universe"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"

    # API configuration
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days
    JWT_ALGORITHM: str = "HS256"

    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./test.db"
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ECHO: bool = True
    SQLALCHEMY_POOL_SIZE: int = 5
    SQLALCHEMY_MAX_OVERFLOW: int = 10

    # File paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    TEST_REPORTS_DIR: Path = BASE_DIR / "reports"

    # First superuser
    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"

    # Audio settings
    AUDIO_SAMPLE_RATE: int = 44100  # Standard CD-quality sample rate
    AUDIO_CHANNELS: int = 2  # Stereo
    AUDIO_BIT_DEPTH: int = 16  # CD-quality bit depth
    AUDIO_BUFFER_SIZE: int = 2048  # Buffer size for real-time processing
    AUDIO_MAX_LENGTH: int = 300  # Maximum audio length in seconds
    AUDIO_FORMAT: str = "wav"  # Default audio format
    AUDIO_QUALITY: float = 0.9  # Audio quality for compression (0.0 to 1.0)

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"  # Allow extra fields in the settings

settings = Settings()
