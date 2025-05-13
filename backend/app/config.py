import os
from datetime import timedelta

class Config:
    # Basic Flask config
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    PORT = int(os.environ.get('PORT', 5002))

    # Database config - PostgreSQL only
    database_url = os.environ.get('DATABASE_URL') or 'postgresql://postgres:postgres@localhost:5432/harmonic_universe'

    # Handle PostgreSQL URL from render.com (starts with postgres://) vs SQLAlchemy (requires postgresql://)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # PostgreSQL-specific settings with reduced timeouts to prevent 504 errors
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_timeout': 30,  # Add explicit timeout of 30 seconds
        'pool_recycle': 1800,  # Recycle connections after 30 minutes instead of 60
        'pool_pre_ping': True,
        'max_overflow': 15,
        'connect_args': {
            'connect_timeout': 10,  # PostgreSQL connection timeout in seconds
            'application_name': 'harmonic_universe',  # Help identify app in PostgreSQL logs
        }
    }

    # Application environment
    ENV = os.environ.get('FLASK_ENV', 'development')

    # Auto-create tables flag
    AUTO_CREATE_TABLES = os.environ.get('AUTO_CREATE_TABLES', 'False').lower() == 'true'

    # JWT config
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    # By default, use the same key for refresh tokens
    JWT_REFRESH_SECRET_KEY = os.environ.get('JWT_REFRESH_SECRET_KEY') or JWT_SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']
    JWT_ERROR_MESSAGE_KEY = 'message'
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_COOKIE_CSRF_PROTECT = False  # Disable CSRF for simplicity during development
    JWT_COOKIE_SECURE = False  # Set to True in production
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    # Secure cookies in production
    JWT_COOKIE_SAMESITE = 'None' if os.environ.get('FLASK_ENV', 'development') == 'production' else 'Lax'

    # Log the secret key in development mode to help with debugging
    if os.environ.get('FLASK_ENV', 'development') == 'development' or os.environ.get('FLASK_DEBUG', 'False').lower() == 'true':
        print(f"DEBUG - JWT_SECRET_KEY: '{JWT_SECRET_KEY[:5]}...'")
        print(f"DEBUG - JWT_REFRESH_SECRET_KEY: '{JWT_REFRESH_SECRET_KEY[:5]}...'")

    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
    CORS_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    CORS_HEADERS = ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With", "X-CSRF-Token"]
    CORS_EXPOSE_HEADERS = ["Content-Length", "Content-Type", "Authorization"]
    CORS_MAX_AGE = 86400  # 24 hours
    CORS_SUPPORTS_CREDENTIALS = True
    CORS_RESOURCES = {r"/api/*": {"origins": CORS_ORIGINS}}

    # Security config
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV', 'development') == 'production'
    SESSION_COOKIE_SAMESITE = 'lax'
    SESSION_COOKIE_HTTPONLY = True

    # Rate limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', "memory://")
    RATELIMIT_STRATEGY = "moving-window"
    RATELIMIT_DEFAULT = "1000 per day, 100 per hour" if os.environ.get('FLASK_ENV') == 'development' else "200 per day, 50 per hour"

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

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True
    LOG_LEVEL = 'DEBUG'
    # Optimized development connection pool settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,
        'pool_timeout': 20,  # Even lower timeout for development
        'pool_recycle': 600,  # 10 minutes for development
        'max_overflow': 10,
        'pool_pre_ping': True,
        'connect_args': {
            'connect_timeout': 5,  # 5 seconds connect timeout in development
            'application_name': 'harmonic_universe_dev',
        }
    }
    # In development, create tables automatically by default
    AUTO_CREATE_TABLES = os.environ.get('AUTO_CREATE_TABLES', 'True').lower() == 'true'
    CORS_CONFIG = {
        'ORIGINS': [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ],
    }

    # Override CORS settings for development
    CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']
    CORS_SUPPORTS_CREDENTIALS = True

    # More permissive rate limiting for development
    RATELIMIT_DEFAULT = "1000 per day, 100 per hour"

    # JWT settings for development
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_SAMESITE = 'Lax'

class TestingConfig(Config):
    TESTING = True
    # For testing, we need a separate PostgreSQL test database
    TEST_DATABASE_URL = os.environ.get('TEST_DATABASE_URL')
    if TEST_DATABASE_URL:
        if TEST_DATABASE_URL.startswith('postgres://'):
            TEST_DATABASE_URL = TEST_DATABASE_URL.replace('postgres://', 'postgresql://', 1)
        SQLALCHEMY_DATABASE_URI = TEST_DATABASE_URL
    # Minimal connection pool for testing
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 3,
        'pool_timeout': 10,  # Short timeout for testing
        'pool_recycle': 300,  # 5 minutes for testing
        'max_overflow': 5,
        'pool_pre_ping': True,
        'connect_args': {
            'connect_timeout': 3,  # Very short connect timeout for tests
            'application_name': 'harmonic_universe_test',
        }
    }
    WTF_CSRF_ENABLED = False
    LOG_LEVEL = 'DEBUG'
    # In testing, allow table creation
    AUTO_CREATE_TABLES = True
    PRESERVE_CONTEXT_ON_EXCEPTION = False
    CORS_CONFIG = {
        'ORIGINS': ['*'],  # Allow all origins in testing
    }

    # Allow all origins in testing
    CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']  # Use specific origins for testing
    CORS_RESOURCES = {r"/api/*": {"origins": CORS_ORIGINS}}

    # Disable rate limiting in testing
    RATELIMIT_ENABLED = False

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    SQLALCHEMY_ECHO = False
    LOG_LEVEL = 'INFO'
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    # Production connection pool settings optimized for performance and reliability
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 20,
        'pool_timeout': 30,  # 30 seconds timeout
        'pool_recycle': 1800,  # 30 minutes for production
        'max_overflow': 20,
        'pool_pre_ping': True,
        'connect_args': {
            'connect_timeout': 10,  # 10 seconds connect timeout
            'application_name': 'harmonic_universe_prod',
            'keepalives': 1,  # Enable TCP keepalives
            'keepalives_idle': 60,  # Seconds between keepalives
            'keepalives_interval': 10,  # Seconds between retries
            'keepalives_count': 3,  # Retry count
        }
    }
    # In production, never create tables automatically
    AUTO_CREATE_TABLES = False
    CORS_CONFIG = {
        'ORIGINS': [
            'https://harmonic-universe.vercel.app',
            'https://harmonic-universe-git-main-someones-projects-4ec78d48.vercel.app'
        ],
    }

    # Strict CORS in production
    CORS_ORIGINS = [
        'https://harmonic-universe.vercel.app',
        'https://harmonic-universe-git-main-someones-projects-4ec78d48.vercel.app'
    ]
    CORS_RESOURCES = {r"/api/*": {"origins": CORS_ORIGINS}}
    CORS_SUPPORTS_CREDENTIALS = True

    # Production rate limiting
    RATELIMIT_DEFAULT = "200 per day, 50 per hour"

    # Secure cookie settings
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_SAMESITE = 'Strict'

config_by_name = {
    'dev': DevelopmentConfig,
    'test': TestingConfig,
    'prod': ProductionConfig,
    'default': DevelopmentConfig
}
