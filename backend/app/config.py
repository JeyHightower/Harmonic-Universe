import os
from datetime import timedelta
from dotenv import load_dotenv
from urllib.parse import urlparse
from pathlib import Path

load_dotenv()

class Config:
    """Base config class"""
    # Load DATABASE_URL from environment variable
    # PostgreSQL is required for all environments
    database_url = os.environ.get('DATABASE_URL')
    
    # Verify that DATABASE_URL is set and valid
    if not database_url:
        raise ValueError(
            "DATABASE_URL environment variable is required. "
            "PostgreSQL is required for this application. "
            "Please set DATABASE_URL to a valid PostgreSQL connection string."
        )
    
    # Convert postgres:// to postgresql:// for SQLAlchemy compatibility
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    # Verify that it's a PostgreSQL URL
    parsed_url = urlparse(database_url)
    if parsed_url.scheme not in ('postgresql', 'postgres'):
        raise ValueError(
            f"Invalid database type: {parsed_url.scheme}. "
            "Only PostgreSQL is supported. Please use a valid PostgreSQL URL."
        )
    
    # Set SQLAlchemy configuration
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # PostgreSQL-specific settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
    }
    
    # General settings
    AUTO_CREATE_TABLES = False  # We'll use migrations for schema management
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-dev-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret-key')
    
    # CORS settings
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')
    CORS_SUPPORTS_CREDENTIALS = os.environ.get('CORS_SUPPORTS_CREDENTIALS', 'true').lower() == 'true'
    
    # Basic Flask config
    DEBUG = os.environ.get('FLASK_DEBUG', '0') == '1'
    PORT = int(os.environ.get('PORT', 5001))
    
    # Application environment
    ENV = os.environ.get('FLASK_ENV', 'development')
    
    # JWT config
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    # Use both headers and cookies for JWT
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    # Secure cookies in production
    JWT_COOKIE_SECURE = ENV == 'production'
    JWT_COOKIE_SAMESITE = 'None' if ENV == 'production' else 'Lax'
    # Don't CSRF protect the JWT endpoints
    JWT_COOKIE_CSRF_PROTECT = False
    
    # CORS config
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    CORS_HEADERS = ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 
                   'Access-Control-Allow-Credentials', 'Access-Control-Allow-Headers', 
                   'Access-Control-Allow-Methods', 'Access-Control-Allow-Origin',
                   'Cache-Control', 'Pragma', 'X-CSRFToken']
    CORS_EXPOSE_HEADERS = ['Content-Length', 'Content-Type', 'Authorization', 'X-CSRFToken']
    CORS_MAX_AGE = 600
    CORS_SEND_WILDCARD = False  # Important for credentials
    
    # Security config
    SESSION_COOKIE_SECURE = ENV == 'production'
    SESSION_COOKIE_SAMESITE = 'lax'
    SESSION_COOKIE_HTTPONLY = True
    
    # Rate limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = "memory://"
    RATELIMIT_STRATEGY = "fixed-window"
    RATELIMIT_DEFAULT = "100 per minute"
    
    # API config
    API_PREFIX = '/api'
    API_VERSION = '1'
    
    # Error handling
    ERROR_404_HELP = False
    ERROR_405_HELP = False
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Cache config
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes
    
    # Health check
    HEALTH_CHECK_ENDPOINT = '/api/health'
    
    # Feature flags
    ENABLE_MFA = os.environ.get('ENABLE_MFA', 'False').lower() == 'true'
    ENABLE_PASSWORD_RESET = os.environ.get('ENABLE_PASSWORD_RESET', 'True').lower() == 'true'
    ENABLE_ACCOUNT_LOCKOUT = os.environ.get('ENABLE_ACCOUNT_LOCKOUT', 'True').lower() == 'true'
    ENABLE_DEBUG_LOGGING = os.environ.get('ENABLE_DEBUG_LOGGING', 'False').lower() == 'true'
    MOCK_AUTH_IN_DEV = os.environ.get('MOCK_AUTH_IN_DEV', 'False').lower() == 'true'
    DEMO_MODE = os.environ.get('DEMO_MODE', 'False').lower() == 'true'
    OFFLINE_MODE = os.environ.get('OFFLINE_MODE', 'True').lower() == 'true'
    DEBUG_MODE = os.environ.get('DEBUG_MODE', 'False').lower() == 'true'
    ANALYTICS = os.environ.get('ANALYTICS', 'False').lower() == 'true'
    PERFORMANCE_MONITORING = os.environ.get('PERFORMANCE_MONITORING', 'False').lower() == 'true'

    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', './instance/uploads')

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True
    LOG_LEVEL = 'DEBUG'
    
    # Reduce connection pool size for development
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,
        'max_overflow': 10,
        'pool_recycle': 300,
        'pool_pre_ping': True,
    }

class TestingConfig(Config):
    TESTING = True
    # Important: Still use a real PostgreSQL database for testing, not in-memory
    # This ensures tests match production behavior more closely
    LOG_LEVEL = 'DEBUG'
    WTF_CSRF_ENABLED = False
    
    # Minimal connection pool for testing
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 3,
        'max_overflow': 5,
        'pool_recycle': 300,
        'pool_pre_ping': True,
    }

    # Override DATABASE_URL with test-specific database if needed
    TEST_DATABASE_URL = os.environ.get('TEST_DATABASE_URL')
    if TEST_DATABASE_URL:
        if TEST_DATABASE_URL.startswith('postgres://'):
            TEST_DATABASE_URL = TEST_DATABASE_URL.replace('postgres://', 'postgresql://', 1)
        SQLALCHEMY_DATABASE_URI = TEST_DATABASE_URL

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    SQLALCHEMY_ECHO = False
    LOG_LEVEL = 'INFO'
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    
    # Production gets the default connection pool settings
    # defined in the base Config class

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 