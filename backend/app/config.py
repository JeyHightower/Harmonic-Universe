# app/config.py
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Basic Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///harmonic_universe.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'

    # CSRF Protection
    WTF_CSRF_ENABLED = True
    WTF_CSRF_SECRET_KEY = os.environ.get('CSRF_SECRET_KEY', 'csrf-secret-key')
    WTF_CSRF_TIME_LIMIT = None  # No time limit for CSRF tokens
    WTF_CSRF_CHECK_DEFAULT = False  # Don't check CSRF for all routes by default

    # Session Configuration
    SESSION_TYPE = 'filesystem'
    PERMANENT_SESSION_LIFETIME = timedelta(days=1)
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_NAME = 'session'
    SESSION_COOKIE_PATH = '/'

    # CORS Configuration
    CORS_ORIGINS = [
        'http://localhost:3000',  # React default
        'http://localhost:5173'   # Vite default
    ]
    CORS_SUPPORTS_CREDENTIALS = True
    CORS_EXPOSE_HEADERS = ['X-CSRF-Token']
    CORS_ALLOW_HEADERS = ['Content-Type', 'X-CSRF-Token']
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # Use in-memory database for testing
    WTF_CSRF_ENABLED = False  # Disable CSRF protection in tests
    SECRET_KEY = 'test-secret-key'
    WTF_CSRF_SECRET_KEY = 'test-csrf-secret-key'
    SERVER_NAME = 'localhost.localdomain'  # Required for URL generation in tests
