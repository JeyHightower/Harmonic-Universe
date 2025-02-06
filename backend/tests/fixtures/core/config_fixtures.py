"""Configuration test fixtures."""

import pytest
from typing import Dict, Any
from pathlib import Path
import os
from app.core.config.settings import Settings
from app.core.config.test_settings import TestSettings

@pytest.fixture
def test_env_vars() -> Dict[str, str]:
    """Get test environment variables."""
    return {
        "TESTING": "1",
        "SECRET_KEY": "test_secret_key",
        "FIRST_SUPERUSER_EMAIL": "admin@example.com",
        "FIRST_SUPERUSER_PASSWORD": "admin123",
        "BACKEND_CORS_ORIGINS": "http://localhost,http://localhost:4200,http://localhost:3000",
        "PROJECT_NAME": "Harmonic Universe Test"
    }

@pytest.fixture
def test_settings(test_env_vars: Dict[str, str]) -> Settings:
    """Get test settings with environment variables."""
    # Set environment variables
    for key, value in test_env_vars.items():
        os.environ[key] = value

    settings = Settings()

    # Clean up
    for key in test_env_vars:
        del os.environ[key]

    return settings

@pytest.fixture
def test_paths(test_settings: Settings) -> Dict[str, Path]:
    """Get test path settings."""
    return {
        "upload_dir": test_settings.UPLOAD_DIR,
        "temp_dir": test_settings.UPLOAD_DIR / "temp",
        "test_reports_dir": test_settings.TEST_REPORTS_DIR,
        "db_dir": Path(test_settings.DATABASE_URI.replace("sqlite:///", "")).parent
    }

@pytest.fixture
def test_cors_settings(test_settings: Settings) -> Dict[str, Any]:
    """Get test CORS settings."""
    return {
        "origins": test_settings.BACKEND_CORS_ORIGINS,
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"]
    }

@pytest.fixture
def test_jwt_settings(test_settings: Settings) -> Dict[str, Any]:
    """Get test JWT settings."""
    return {
        "secret_key": test_settings.SECRET_KEY,
        "algorithm": test_settings.JWT_ALGORITHM,
        "access_token_expire_minutes": test_settings.ACCESS_TOKEN_EXPIRE_MINUTES
    }
