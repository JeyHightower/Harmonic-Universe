# app/config.py
import os
from datetime import timedelta

class Config:
    """Base configuration."""
    # Basic Flask config
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

    # SQLAlchemy config
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {}  # Empty for SQLite

    # Redis config
    REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
    REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD')
    REDIS_DB = int(os.environ.get('REDIS_DB', 0))

    # Cache config
    CACHE_TYPE = 'redis'
    CACHE_REDIS_HOST = REDIS_HOST
    CACHE_REDIS_PORT = REDIS_PORT
    CACHE_REDIS_PASSWORD = REDIS_PASSWORD
    CACHE_REDIS_DB = REDIS_DB
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_KEY_PREFIX = 'harmonic_universe:'

    # Session config
    SESSION_TYPE = 'redis'
    SESSION_REDIS_HOST = REDIS_HOST
    SESSION_REDIS_PORT = REDIS_PORT
    SESSION_REDIS_DB = REDIS_DB + 1  # Use different DB for sessions
    PERMANENT_SESSION_LIFETIME = timedelta(days=31)

    # CORS config
    CORS_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:5000',
        'https://harmonic-universe.com',
    ]
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
    CORS_SUPPORTS_CREDENTIALS = True

    # Security config
    CSRF_ENABLED = True
    CSRF_TIME_LIMIT = timedelta(hours=1)
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

    # Rate limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB + 2}'
    RATELIMIT_STRATEGY = 'fixed-window'
    RATELIMIT_DEFAULT = '200 per day'

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'sqlite:///' + os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dev.db')
    SESSION_COOKIE_SECURE = False
    CORS_ORIGINS = ['*']

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or 'sqlite://'
    WTF_CSRF_ENABLED = False
    SESSION_COOKIE_SECURE = False

class ProductionConfig(Config):
    """Production configuration."""
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_ENGINE_OPTIONS = {  # Only use pool options for production PostgreSQL
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
    }
    CORS_ORIGINS = [
        'https://harmonic-universe.com',
        'https://www.harmonic-universe.com',
    ]
    RATELIMIT_DEFAULT = '100 per day'

    @classmethod
    def init_app(cls, app):
        # Log to syslog
        import logging
        from logging.handlers import SysLogHandler
        syslog_handler = SysLogHandler()
        syslog_handler.setLevel(logging.WARNING)
        app.logger.addHandler(syslog_handler)

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
