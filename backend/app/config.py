import os
from datetime import timedelta

class Config:
    # Basic Flask config
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    PORT = int(os.environ.get('PORT', 5001))
    
    # Database config
    # Relative path to instance directory for sqlite
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'instance', 'app.db')
    
    # Handle PostgreSQL URL from render.com (starts with postgres://) vs SQLAlchemy (requires postgresql://)
    database_url = os.environ.get('DATABASE_URL', f'sqlite:///{db_path}')
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Application environment
    ENV = os.environ.get('FLASK_ENV', 'development')
    
    # Auto-create tables flag
    AUTO_CREATE_TABLES = os.environ.get('AUTO_CREATE_TABLES', 'False').lower() == 'true'
    
    # JWT config
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # CORS config
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5001,https://harmonic-universe.onrender.com,https://harmonic-universe-z5ka.onrender.com,*').split(',')
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    CORS_HEADERS = ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 
                   'Access-Control-Allow-Credentials', 'Access-Control-Allow-Headers', 
                   'Access-Control-Allow-Methods', 'Access-Control-Allow-Origin',
                   'Cache-Control', 'Pragma', 'X-CSRFToken']
    CORS_EXPOSE_HEADERS = ['Content-Length', 'Content-Type', 'Authorization', 'X-CSRFToken']
    CORS_MAX_AGE = 600
    CORS_SUPPORTS_CREDENTIALS = True
    CORS_SEND_WILDCARD = False  # Important for credentials
    
    # Security config
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV', 'development') == 'production'
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

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True
    LOG_LEVEL = 'DEBUG'
    # In development, create tables automatically by default
    AUTO_CREATE_TABLES = os.environ.get('AUTO_CREATE_TABLES', 'True').lower() == 'true'

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    LOG_LEVEL = 'DEBUG'
    # In testing, always create tables automatically
    AUTO_CREATE_TABLES = True

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    SQLALCHEMY_ECHO = False
    LOG_LEVEL = 'INFO'
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    # In production, never create tables automatically
    AUTO_CREATE_TABLES = False

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 