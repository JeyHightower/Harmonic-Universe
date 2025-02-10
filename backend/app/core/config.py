"""Configuration settings for the application."""
from datetime import timedelta
import os
from typing import Optional

class Config:
    """Base configuration."""
    # Flask settings
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
    DEBUG = False
    TESTING = False

    # Project info
    PROJECT_NAME = "Harmonic Universe"
    VERSION = "1.0.0"

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/harmonic_universe"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Settings
    JWT_SECRET_KEY = SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)

    # CORS
    CORS_ORIGINS = ["*"]

    # Audio Processing
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../uploads')
    AUDIO_UPLOAD_DIR = os.path.join(UPLOAD_FOLDER, 'audio')
    AUDIO_SAMPLE_RATE = 44100
    MAX_AUDIO_LENGTH = 600  # seconds
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

    # AI Service
    AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:5001")
    AI_SERVICE_API_KEY = os.getenv("AI_SERVICE_API_KEY")

    @staticmethod
    def init_app(app):
        """Initialize application."""
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(app.config['AUDIO_UPLOAD_DIR'], exist_ok=True)

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "postgresql://postgres:postgres@localhost:5432/harmonic_universe_dev"

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "postgresql://postgres:postgres@localhost:5432/harmonic_universe_test"

class ProductionConfig(Config):
    """Production configuration."""
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")

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
