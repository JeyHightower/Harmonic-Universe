"""Configuration settings for the application."""
from datetime import timedelta
import os
from typing import Optional, List, Union
from pydantic import AnyHttpUrl, validator, Field
from pydantic_settings import BaseSettings
from pathlib import Path

def clean_env_value(value: str) -> str:
    """Clean environment variable value by removing comments."""
    if value is None:
        return None
    return value.split('#')[0].strip()

def get_env_value(key: str, default: str) -> str:
    """Get environment variable value with cleaning."""
    value = os.getenv(key)
    if value is None:
        return clean_env_value(default)
    return clean_env_value(value)

class Settings(BaseSettings):
    """Application settings."""
    # Project info
    PROJECT_NAME: str = "Harmonic Universe"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"

    # API configuration
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(default_factory=lambda: get_env_value("SECRET_KEY", "your-secret-key-here"))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default_factory=lambda: int(get_env_value("ACCESS_TOKEN_EXPIRE_MINUTES", "11520")))
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default_factory=lambda: int(get_env_value("REFRESH_TOKEN_EXPIRE_DAYS", "30")))
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
    SQLALCHEMY_DATABASE_URI: str = Field(
        default_factory=lambda: get_env_value(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/harmonic_universe_dev"
        ).replace('db:5432', 'localhost:5432')
    )
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ECHO: bool = True
    SQLALCHEMY_POOL_SIZE: int = Field(default_factory=lambda: int(get_env_value("SQLALCHEMY_POOL_SIZE", "5")))
    SQLALCHEMY_MAX_OVERFLOW: int = Field(default_factory=lambda: int(get_env_value("SQLALCHEMY_MAX_OVERFLOW", "10")))

    # File paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    TEST_REPORTS_DIR: Path = BASE_DIR / "reports"

    # First superuser
    FIRST_SUPERUSER_EMAIL: str = Field(default_factory=lambda: get_env_value("FIRST_SUPERUSER_EMAIL", "admin@example.com"))
    FIRST_SUPERUSER_PASSWORD: str = Field(default_factory=lambda: get_env_value("FIRST_SUPERUSER_PASSWORD", "admin123"))

    # Audio settings
    AUDIO_SAMPLE_RATE: int = Field(default_factory=lambda: int(get_env_value("AUDIO_SAMPLE_RATE", "44100")))
    AUDIO_CHANNELS: int = 2
    AUDIO_BIT_DEPTH: int = 16
    AUDIO_BUFFER_SIZE: int = 2048
    AUDIO_MAX_LENGTH: int = Field(default_factory=lambda: int(get_env_value("MAX_AUDIO_LENGTH", "600")))
    AUDIO_FORMAT: str = "wav"
    AUDIO_QUALITY: float = 0.9
    AUDIO_UPLOAD_DIR: Path = UPLOAD_DIR / "audio"

    # File upload settings (16MB max file size)
    MAX_CONTENT_LENGTH: int = Field(default=16 * 1024 * 1024)  # 16MB

    @validator("MAX_CONTENT_LENGTH", pre=True)
    def validate_max_content_length(cls, v):
        if isinstance(v, str):
            # Remove any comments and convert to int
            clean_value = clean_env_value(v)
            return int(clean_value)
        return v

    # AI Service settings
    AI_SERVICE_URL: str = Field(default_factory=lambda: get_env_value("AI_SERVICE_URL", "http://localhost:5001"))
    AI_SERVICE_API_KEY: Optional[str] = Field(default_factory=lambda: get_env_value("AI_SERVICE_API_KEY", None))

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()

class Config:
    """Base configuration."""
    # Flask settings
    SECRET_KEY = get_env_value("SECRET_KEY", "your-secret-key-here")
    DEBUG = get_env_value("DEBUG", "True").lower() == "true"
    TESTING = False

    # Project info
    PROJECT_NAME = "Harmonic Universe"
    VERSION = "1.0.0"

    # Database
    SQLALCHEMY_DATABASE_URI = get_env_value(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/harmonic_universe"
    ).replace('db:5432', 'localhost:5432')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Settings
    JWT_SECRET_KEY = SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(get_env_value("JWT_ACCESS_TOKEN_EXPIRES", "30")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(get_env_value("JWT_REFRESH_TOKEN_EXPIRES", "7")))

    # CORS
    CORS_ORIGINS = ["*"]

    # Audio Processing
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../uploads')
    AUDIO_UPLOAD_DIR = os.path.join(UPLOAD_FOLDER, 'audio')
    AUDIO_SAMPLE_RATE = int(get_env_value("AUDIO_SAMPLE_RATE", "44100"))
    MAX_AUDIO_LENGTH = int(get_env_value("MAX_AUDIO_LENGTH", "600"))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

    # AI Service
    AI_SERVICE_URL = get_env_value("AI_SERVICE_URL", "http://localhost:5001")
    AI_SERVICE_API_KEY = get_env_value("AI_SERVICE_API_KEY", None)

    @staticmethod
    def init_app(app):
        """Initialize application."""
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(app.config['AUDIO_UPLOAD_DIR'], exist_ok=True)

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = get_env_value(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/harmonic_universe_dev"
    ).replace('db:5432', 'localhost:5432')

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = get_env_value(
        "DATABASE_URL_TEST",
        "postgresql://postgres:postgres@localhost:5432/harmonic_universe_test"
    ).replace('db:5432', 'localhost:5432')

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = get_env_value(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/harmonic_universe"
    ).replace('db:5432', 'localhost:5432')

    @classmethod
    def init_app(cls, app):
        Config.init_app(app)

        # Log to stderr in production
        import logging
        from logging import StreamHandler
        file_handler = StreamHandler()
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
