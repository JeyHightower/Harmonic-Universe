from config import Config
import os

class TestConfig(Config):
    """Test configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'test-jwt-secret'
    SECRET_KEY = 'test-secret-key'
    REDIS_URL = None  # Disable Redis for testing
    SOCKETIO_MESSAGE_QUEUE = None  # Disable message queue for testing
    WTF_CSRF_ENABLED = False  # Disable CSRF for testing

    # JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRES = False  # Disable token expiration in tests
    JWT_HEADER_TYPE = 'Bearer'
    JWT_HEADER_NAME = 'Authorization'
    JWT_TOKEN_LOCATION = ['headers']
    JWT_ALGORITHM = 'HS256'
    JWT_IDENTITY_CLAIM = 'sub'
    JWT_ERROR_MESSAGE_KEY = 'message'

    # Rate Limiter Configuration
    RATELIMIT_ENABLED = False  # Disable rate limiting in tests

    # Test file upload settings
    UPLOAD_FOLDER = 'tests/uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
