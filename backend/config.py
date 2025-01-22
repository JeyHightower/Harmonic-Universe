"""Application configuration."""
import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Base configuration."""

    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev')
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')

    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///dev.db')

    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev')
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
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    CORS_HEADERS = 'Content-Type'

    # File upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = 'uploads'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp3', 'wav'}

    # Session
    SESSION_TYPE = 'filesystem'

    # Logging
    LOG_TO_STDOUT = os.environ.get('LOG_TO_STDOUT', 'false').lower() == 'true'

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
    RATELIMIT_DEFAULT = "200 per day"

    # Allow all origins in development
    CORS_ORIGINS = '*'

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-jwt-secret-key'
    RATELIMIT_ENABLED = False
    CORS_ORIGINS = ['http://localhost:5173']
    REDIS_URL = None
    UPLOAD_FOLDER = 'test_uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    LOG_LEVEL = 'DEBUG'
    WTF_CSRF_ENABLED = False
    PRESERVE_CONTEXT_ON_EXCEPTION = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Override environment variables
    def __init__(self):
        """Initialize with test environment variables."""
        import os
        os.environ['JWT_SECRET_KEY'] = self.JWT_SECRET_KEY
        os.environ['SECRET_KEY'] = self.SECRET_KEY
        os.environ['FLASK_DEBUG'] = '1'

class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
    TESTING = False

    # Use environment variables with fallbacks for testing
    SECRET_KEY = os.environ.get('SECRET_KEY', 'test-secret-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'test-jwt-secret-key')

    # Database URL with fallback for testing
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///:memory:')

    # Stricter rate limiting
    RATELIMIT_DEFAULT = "100 per hour"

    # Production CORS settings with fallback for testing
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')

    # Production WebSocket settings
    WEBSOCKET_HOST = '0.0.0.0'
    WEBSOCKET_PORT = int(os.environ.get('PORT', 5002))

    # SSL settings (if not using reverse proxy)
    SSL_CERT = os.environ.get('SSL_CERT')
    SSL_KEY = os.environ.get('SSL_KEY')

    # Redis for rate limiting and caching
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'memory://')

    # Production logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_TO_STDOUT = os.environ.get('LOG_TO_STDOUT', 'false').lower() == 'true'

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
