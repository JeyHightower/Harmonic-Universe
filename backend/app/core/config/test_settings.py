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

    # Base paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

    # Database settings
    DB_DIR: str = os.path.join(BASE_DIR, "tests", "test_db")
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
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "test_uploads")
    TEST_REPORTS_DIR: str = os.path.join(BASE_DIR, "tests", "reports")

    # Test logging
    LOG_LEVEL: str = "DEBUG"
    LOG_TO_STDOUT: bool = True

    class Config:
        env_file = ".env.test"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._setup_directories()
        self._validate_paths()

    def _setup_directories(self):
        """Ensure all required directories exist."""
        directories = [
            self.DB_DIR,
            self.UPLOAD_DIR,
            self.TEST_REPORTS_DIR
        ]

        for dir_path in directories:
            os.makedirs(dir_path, exist_ok=True)

    def _validate_paths(self):
        """Validate that all paths are absolute and exist."""
        paths = {
            "DB_DIR": self.DB_DIR,
            "UPLOAD_DIR": self.UPLOAD_DIR,
            "TEST_REPORTS_DIR": self.TEST_REPORTS_DIR
        }

        for name, path in paths.items():
            if not os.path.isabs(path):
                raise ValueError(f"{name} must be an absolute path. Got: {path}")
            if not os.path.exists(path):
                raise ValueError(f"{name} directory does not exist: {path}")

    def get_test_db_path(self) -> str:
        """Get the absolute path to the test database file."""
        return os.path.abspath(self.DB_FILE)
