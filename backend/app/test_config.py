"""
Test configuration settings.
"""

from pydantic_settings import BaseSettings
from pathlib import Path
import os
from datetime import timedelta
from typing import Dict, Any, Set
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TestSettings(BaseSettings):
    # Database settings - using SQLite for testing
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./test.db"
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ECHO: bool = True

    # Test specific settings
    TESTING: bool = True
    TEST_USER_EMAIL: str = "test@example.com"
    TEST_USER_PASSWORD: str = "test-password"

    # Paths
    ROOT_DIR: Path = Path(__file__).resolve().parent.parent
    TEST_UPLOAD_DIR: Path = ROOT_DIR / "test_uploads"
    TEST_DB_PATH: Path = ROOT_DIR / "test.db"
    ALEMBIC_INI_PATH: Path = ROOT_DIR / "alembic.ini"

    # Security
    SECRET_KEY: str = "test-secret-key"
    JWT_SECRET_KEY: str = "test-jwt-secret"
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(minutes=30)
    JWT_REFRESH_TOKEN_EXPIRES: timedelta = timedelta(days=1)

    # CORS
    CORS_ORIGINS: Set[str] = {"*"}
    SOCKETIO_CORS_ALLOWED_ORIGINS: Set[str] = {"*"}

    # File uploads
    UPLOAD_FOLDER: str = "tests/uploads"
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_UPLOAD_EXTENSIONS: Set[str] = {".jpg", ".jpeg", ".png", ".gif", ".mp3", ".wav"}

    class Config:
        case_sensitive = True

    @classmethod
    def get_settings(cls) -> Dict[str, Any]:
        """Get all settings as a dictionary."""
        return {
            key: value for key, value in cls.__dict__.items()
            if not key.startswith('_')
        }

    def setup_test_environment(self):
        """Setup test environment directories and logging."""
        logger.info("Setting up test environment")

        # Create test upload directory
        os.makedirs(self.TEST_UPLOAD_DIR, exist_ok=True)
        logger.info(f"Created test upload directory at {self.TEST_UPLOAD_DIR}")

        # Remove existing test database if it exists
        if self.TEST_DB_PATH.exists():
            logger.info(f"Removing existing test database at {self.TEST_DB_PATH}")
            self.TEST_DB_PATH.unlink()

        # Create test database directory if it doesn't exist
        self.TEST_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

        logger.info("Test environment setup complete")

test_settings = TestSettings()

# Ensure test directories exist
test_settings.setup_test_environment()
