import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Basic Flask config
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///dev.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Session/Cookie config
    SESSION_TYPE = 'filesystem'
    SESSION_COOKIE_NAME = 'session'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(days=31)

    # CSRF config
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None

    # JWT config
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # CORS config
    CORS_HEADERS = 'Content-Type'
    CORS_EXPOSE_HEADERS = ['X-CSRF-Token']
    CORS_SUPPORTS_CREDENTIALS = True

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'
    WTF_CSRF_ENABLED = False
