"""Configuration settings for the application."""
from datetime import timedelta
import os
from typing import Optional, List

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

    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # JWT Settings
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-jwt-secret-here")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "30")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "7")))
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
    CORS_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    CORS_HEADERS = ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
    CORS_EXPOSE_HEADERS = ["Content-Length", "Content-Type"]
    CORS_SUPPORTS_CREDENTIALS = True
    CORS_MAX_AGE = 600  # 10 minutes

    # Audio Processing
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../uploads')
    AUDIO_UPLOAD_DIR = os.path.join(UPLOAD_FOLDER, 'audio')
    AUDIO_SAMPLE_RATE = int(os.getenv("AUDIO_SAMPLE_RATE", 44100))
    MAX_AUDIO_LENGTH = int(os.getenv("MAX_AUDIO_LENGTH", 300))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

    # Monitoring
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    SENTRY_DSN = os.getenv("SENTRY_DSN")

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
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/harmonic_universe_dev"
    )

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_DATABASE_URL",
        "postgresql://user:password@localhost:5432/harmonic_universe_test"
    )

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
