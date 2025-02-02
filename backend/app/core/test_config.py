"""Test configuration settings."""
from pydantic_settings import BaseSettings

class TestSettings(BaseSettings):
    """Test settings."""

    PROJECT_NAME: str = "Harmonic Universe Test"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "test-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./test.db"
    SQLALCHEMY_ECHO: bool = False

    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000"]

    # Test superuser
    FIRST_SUPERUSER_EMAIL: str = "test@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "test123"

    class Config:
        case_sensitive = True

test_settings = TestSettings()
