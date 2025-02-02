"""
Application configuration settings.
"""

import os
import sys
import secrets
from typing import Any, Dict, Optional, List, Union
from pydantic import AnyHttpUrl, EmailStr, HttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "Harmonic Universe API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "HS256"  # JWT encoding algorithm

    # Required settings with defaults
    DATABASE_URI: str = "sqlite:///./test.db"
    UPLOAD_DIR: str = "uploads"
    ALLOWED_AUDIO_TYPES: list = ["audio/mpeg", "audio/wav"]
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587  # Added default SMTP port
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379  # Added default Redis port
    WS_MESSAGE_QUEUE_SIZE: int = 100
    WS_HEARTBEAT_INTERVAL: int = 30  # Added WebSocket heartbeat interval

    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database Configuration
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "harmonic_universe")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None
    SQLALCHEMY_ECHO: bool = False

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    def assemble_db_connection(cls, v: Optional[str], info: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        values = info.data
        db_url = PostgresDsn.build(
            scheme="postgresql",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=values.get("POSTGRES_PORT"),
            path=values.get("POSTGRES_DB")
        )
        return str(db_url)

    # Test Database Configuration
    TEST_POSTGRES_DB: str = "test_harmonic_universe"

    @property
    def TEST_SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        """Get test database URI."""
        return PostgresDsn.build(
            scheme="postgresql",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.TEST_POSTGRES_DB
        )

    # Debug settings
    DEBUG: bool = False
    TESTING: bool = False

    # Logging settings
    LOG_LEVEL: str = "INFO"
    LOG_TO_STDOUT: bool = True

    # Email Configuration
    SMTP_TLS: bool = True
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[EmailStr] = None
    EMAILS_FROM_NAME: Optional[str] = None

    @field_validator("EMAILS_FROM_NAME", mode="before")
    def get_project_name(cls, v: Optional[str], info: Dict[str, Any]) -> str:
        if not v:
            return info.data["PROJECT_NAME"]
        return v

    # File Upload Configuration
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [".wav", ".mp3", ".ogg", ".midi", ".mid"]

    # WebSocket Configuration
    WS_MESSAGE_QUEUE: str = "redis://localhost"

    # Initial superuser
    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin-password"

    # Optional Redis config
    REDIS_URL: Optional[str] = None

    model_config = SettingsConfigDict(case_sensitive=True)

class TestSettings(Settings):
    """Test settings configuration."""
    TESTING: bool = True
    DEBUG: bool = True
    ENVIRONMENT: str = "test"
    PROJECT_NAME: str = "Harmonic Universe API"
    VERSION: str = "1.0.0"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    ALGORITHM: str = "HS256"  # JWT encoding algorithm

    # Use in-memory SQLite for tests by default
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///:memory:"
    DATABASE_URI: str = "sqlite:///:memory:"

    # Test-specific settings
    TEST_USER_EMAIL: str = "test@example.com"
    TEST_USER_PASSWORD: str = "test-password"

    # Override environment-specific settings
    SECRET_KEY: str = "test-secret-key-with-minimum-length-of-32-chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Email settings
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USER: str = "test@example.com"
    SMTP_PASSWORD: str = "test-password"
    EMAILS_FROM_EMAIL: EmailStr = "test@example.com"
    EMAILS_FROM_NAME: str = "Harmonic Universe API Test"

    # Redis settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    WS_HEARTBEAT_INTERVAL: int = 30

    # Upload settings
    UPLOAD_DIR: str = "test_uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [".wav", ".mp3", ".ogg", ".midi", ".mid"]

    # Test logging
    LOG_LEVEL: str = "DEBUG"
    LOG_TO_STDOUT: bool = True

    # Convert UPLOAD_DIR to Path and ensure it exists
    @field_validator("UPLOAD_DIR", mode="before")
    def convert_upload_dir_to_path(cls, v: str) -> str:
        path = Path(v).absolute()
        path.mkdir(parents=True, exist_ok=True)
        return str(path)

# Create settings instance based on environment
settings = TestSettings() if "pytest" in sys.modules else Settings()
