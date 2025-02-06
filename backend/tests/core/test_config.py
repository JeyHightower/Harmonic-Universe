"""Test application configuration settings."""

import os
import pytest
from pathlib import Path
from app.core.config.settings import Settings
from app.core.config.test_settings import TestSettings

def test_settings_initialization():
    """Test that settings are initialized correctly."""
    settings = Settings()

    # Test required environment variables
    assert settings.PROJECT_NAME == "Harmonic Universe"
    assert settings.API_V1_STR == "/api/v1"
    assert settings.SECRET_KEY is not None

    # Test database configuration
    assert settings.DATABASE_URI is not None
    assert settings.DATABASE_URI.startswith('postgresql+asyncpg://')

    # Test JWT settings
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0
    assert settings.JWT_ALGORITHM == "HS256"

    # Test CORS settings
    assert settings.BACKEND_CORS_ORIGINS is not None
    assert isinstance(settings.BACKEND_CORS_ORIGINS, list)

def test_test_settings():
    """Test that test settings override production settings correctly."""
    test_settings = TestSettings()

    # Test database configuration
    assert 'test' in test_settings.DATABASE_URI.lower()
    assert test_settings.DB_FILE.endswith('.db')

    # Test file paths
    assert isinstance(test_settings.UPLOAD_DIR, Path)
    assert isinstance(test_settings.TEST_REPORTS_DIR, Path)

    # Test superuser configuration
    assert test_settings.FIRST_SUPERUSER_EMAIL.endswith('@example.com')
    assert test_settings.FIRST_SUPERUSER_PASSWORD is not None

def test_environment_variables():
    """Test that environment variables are properly loaded."""
    # Set test environment variables
    os.environ['SECRET_KEY'] = 'test_secret_key'
    os.environ['FIRST_SUPERUSER_EMAIL'] = 'test@example.com'

    settings = Settings()

    # Test that environment variables are loaded
    assert settings.SECRET_KEY == 'test_secret_key'
    assert settings.FIRST_SUPERUSER_EMAIL == 'test@example.com'

    # Clean up
    del os.environ['SECRET_KEY']
    del os.environ['FIRST_SUPERUSER_EMAIL']

def test_path_settings():
    """Test that path settings are configured correctly."""
    settings = Settings()

    # Test upload directory
    assert settings.UPLOAD_DIR.exists()
    assert settings.UPLOAD_DIR.is_dir()

    # Test that temporary directories are created
    temp_dir = settings.UPLOAD_DIR / 'temp'
    temp_dir.mkdir(exist_ok=True)
    assert temp_dir.exists()

    # Clean up
    if temp_dir.exists():
        temp_dir.rmdir()

def test_cors_origins_parsing():
    """Test that CORS origins are parsed correctly."""
    # Test with string input
    os.environ['BACKEND_CORS_ORIGINS'] = 'http://localhost,http://localhost:4200,http://localhost:3000'
    settings = Settings()

    assert len(settings.BACKEND_CORS_ORIGINS) == 3
    assert 'http://localhost' in settings.BACKEND_CORS_ORIGINS
    assert 'http://localhost:4200' in settings.BACKEND_CORS_ORIGINS
    assert 'http://localhost:3000' in settings.BACKEND_CORS_ORIGINS

    # Clean up
    del os.environ['BACKEND_CORS_ORIGINS']
