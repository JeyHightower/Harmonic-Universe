"""
Test settings configuration.
"""

from pathlib import Path
from .settings import Settings

class TestSettings(Settings):
    """Test settings configuration."""
    # Test database
    DB_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent / "tests" / "test_db"
    DB_FILE: Path = DB_DIR / "test.db"
    DATABASE_URI: str = f"sqlite:///{DB_FILE}"

    # Test directories
    UPLOAD_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent / "tests" / "test_uploads"
    TEST_REPORTS_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent / "tests" / "reports"

    # Test user
    FIRST_SUPERUSER_EMAIL: str = "test_admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "test_admin123"

    # Test configuration
    ENVIRONMENT: str = "test"
    TESTING: bool = True
    DEBUG: bool = True

    class Config:
        case_sensitive = True

test_settings = TestSettings()
