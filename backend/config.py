"""Application configuration."""
import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Base configuration."""

    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')

    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///app.db')

    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Rate limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_HEADERS_ENABLED = True
    RATELIMIT_STORAGE_URL = "memory://"

    # WebSocket
    WEBSOCKET_HOST = '0.0.0.0'
    WEBSOCKET_PORT = 5002
    WEBSOCKET_PING_INTERVAL = 25
    WEBSOCKET_PING_TIMEOUT = 120

    # CORS
    CORS_ORIGINS = ['http://localhost:3000']  # Add production URLs in ProductionConfig

    # File upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = 'uploads'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp3', 'wav'}

class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True
    TESTING = False

    # Enable more detailed error messages
    PROPAGATE_EXCEPTIONS = True

    # Development database
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'

    # Shorter token expiration for development
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # Less strict rate limiting
    RATELIMIT_DEFAULT = "200 per hour"

    # Allow all origins in development
    CORS_ORIGINS = '*'

class TestingConfig(Config):
    """Testing configuration."""

    TESTING = True
    DEBUG = False

    # Use in-memory database for testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

    # Disable rate limiting for tests
    RATELIMIT_ENABLED = False

    # No token expiration in testing
    JWT_ACCESS_TOKEN_EXPIRES = False

    # Disable CSRF protection in testing
    WTF_CSRF_ENABLED = False

class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
    TESTING = False

    # Must be set in environment
    SECRET_KEY = os.environ['SECRET_KEY']
    JWT_SECRET_KEY = os.environ['JWT_SECRET_KEY']

    # Use PostgreSQL in production
    SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']

    # Stricter rate limiting
    RATELIMIT_DEFAULT = "100 per hour"

    # Production CORS settings
    CORS_ORIGINS = [
        'https://harmonic-universe.com',
        'https://www.harmonic-universe.com'
    ]

    # Production WebSocket settings
    WEBSOCKET_HOST = '0.0.0.0'
    WEBSOCKET_PORT = int(os.environ.get('PORT', 5002))

    # SSL settings (if not using reverse proxy)
    SSL_CERT = os.environ.get('SSL_CERT')
    SSL_KEY = os.environ.get('SSL_KEY')

    # Redis for rate limiting and caching
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

    # Production logging
    LOG_LEVEL = 'INFO'
    LOG_TO_STDOUT = os.environ.get('LOG_TO_STDOUT', 'false').lower() == 'true'

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
