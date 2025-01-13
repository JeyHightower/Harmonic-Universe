# app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Basic Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///harmonic_universe.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # CSRF Protection
    WTF_CSRF_ENABLED = True
    WTF_CSRF_SECRET_KEY = os.environ.get('CSRF_SECRET_KEY', 'csrf-secret-key')

    # Session Configuration
    SESSION_TYPE = 'filesystem'
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours in seconds

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # Use in-memory database for testing
    WTF_CSRF_ENABLED = False  # Disable CSRF protection in tests
    SECRET_KEY = 'test-secret-key'
    WTF_CSRF_SECRET_KEY = 'test-csrf-secret-key'
