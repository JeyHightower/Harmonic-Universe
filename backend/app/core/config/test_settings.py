"""
Test configuration settings.
"""
from typing import List
from pydantic import EmailStr
from pathlib import Path
import os

from .settings import Settings

class TestSettings(Settings):
    """Test settings configuration."""
    TESTING: bool = True
    DEBUG: bool = True
    ENVIRONMENT: str = "test"

    # Database settings
    DB_DIR: str = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "tests", "test_db"))
    DB_FILE: str = os.path.join(DB_DIR, "test.db")
    SQLALCHEMY_DATABASE_URI: str = f"sqlite:///{DB_FILE}"
    DATABASE_URI: str = f"sqlite:///{DB_FILE}"
    TEST_DATABASE_URL: str = f"sqlite:///{DB_FILE}"

    # Test-specific settings
    TEST_USER_EMAIL: str = "test@example.com"
    TEST_USER_PASSWORD: str = "test-password"

    # Override environment-specific settings
    SECRET_KEY: str = "test-secret-key-with-minimum-length-of-32-chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Test directories
    UPLOAD_DIR: str = "test_uploads"
    TEST_REPORTS_DIR: str = "tests/reports"

    # Test logging
    LOG_LEVEL: str = "DEBUG"
    LOG_TO_STDOUT: bool = True

    # Convert directories to Path and ensure they exist
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Ensure test database directory exists
        Path(self.DB_DIR).mkdir(parents=True, exist_ok=True)
        # Ensure other test directories exist
        for dir_path in [self.UPLOAD_DIR, self.TEST_REPORTS_DIR]:
            Path(dir_path).mkdir(parents=True, exist_ok=True)
