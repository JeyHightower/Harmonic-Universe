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
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "HS256"  # JWT encoding algorithm
    SERVER_NAME: str = "Harmonic Universe"
    SERVER_HOST: AnyHttpUrl = "http://localhost:8000"

    # Required settings with defaults
    DATABASE_URI: str = "sqlite+aiosqlite:///./test.db"
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
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database Configuration
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "harmonic_universe")
    POSTGRES_PORT: int = 5432
    SQLALCHEMY_DATABASE_URI: str = "sqlite+aiosqlite:///./test.db"  # Changed to use aiosqlite
    SQLALCHEMY_ECHO: bool = False

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info: Any) -> str:
        """Assemble database connection string."""
        if isinstance(v, str):
            return v

        # For development/testing, use SQLite by default
        if os.getenv("TESTING") or os.getenv("DEVELOPMENT"):
            return "sqlite+aiosqlite:///./test.db"

        # For production, use PostgreSQL
        postgres_user = info.data.get("POSTGRES_USER", "")
        postgres_password = info.data.get("POSTGRES_PASSWORD", "")
        postgres_server = info.data.get("POSTGRES_SERVER", "localhost")
        postgres_db = info.data.get("POSTGRES_DB", "harmonic_universe")
        postgres_port = info.data.get("POSTGRES_PORT", 5432)

        if not all([postgres_user, postgres_password, postgres_server, postgres_db]):
            return "sqlite+aiosqlite:///./test.db"

        return f"postgresql+asyncpg://{postgres_user}:{postgres_password}@{postgres_server}:{postgres_port}/{postgres_db}"

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
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    EMAILS_FROM_EMAIL: Optional[EmailStr] = os.getenv("EMAILS_FROM_EMAIL")
    EMAILS_FROM_NAME: Optional[str] = None
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48
    EMAIL_TEMPLATES_DIR: str = "app/email-templates"
    EMAILS_ENABLED: bool = False

    @field_validator("EMAILS_ENABLED", mode="before")
    @classmethod
    def get_emails_enabled(cls, v: bool, info: Any) -> bool:
        """Check if emails are enabled."""
        return bool(
            info.data.get("SMTP_HOST")
            and info.data.get("SMTP_PORT")
            and info.data.get("EMAILS_FROM_EMAIL")
        )

    @field_validator("EMAILS_FROM_NAME", mode="before")
    @classmethod
    def get_project_name(cls, v: Optional[str], info: Any) -> str:
        if not v:
            return info.data.get("PROJECT_NAME", "Harmonic Universe API")
        return v

    # File Upload Configuration
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [".wav", ".mp3", ".ogg", ".midi", ".mid"]

    # WebSocket Configuration
    WS_MESSAGE_QUEUE: str = os.getenv("WS_MESSAGE_QUEUE", "redis://localhost")

    # Initial superuser
    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin-password"

    # Optional Redis config
    REDIS_URL: Optional[str] = None

    # AI Generation
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    MAX_TOKENS: int = 2048
    TEMPERATURE: float = 0.7
    MODEL_NAME: str = "gpt-3.5-turbo"

    model_config = SettingsConfigDict(case_sensitive=True)

# Create settings instance
settings = Settings()
