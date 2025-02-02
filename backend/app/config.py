"""
Application configuration.
"""

import os
from datetime import timedelta

class Config:
    """Base configuration."""
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev')
    DEBUG = False

    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/harmonic_universe'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

    # SocketIO
    SOCKETIO_CORS_ALLOWED_ORIGINS = CORS_ORIGINS

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = True

    # Use SQLite if DATABASE_URL is not set
    if not os.environ.get('DATABASE_URL'):
        # Get the backend directory path
        backend_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
        # Create instance directory if it doesn't exist
        instance_dir = os.path.join(backend_dir, 'instance')
        os.makedirs(instance_dir, exist_ok=True)

        # Set database URI
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(instance_dir, "dev.db")}'

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False

    # Override these in production
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')
    SOCKETIO_CORS_ALLOWED_ORIGINS = CORS_ORIGINS

# Set configuration based on environment
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

settings = config[os.environ.get('FLASK_ENV', 'default')]
