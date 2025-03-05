import os
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

class Config:
    """Base configuration for the application"""
    # App settings
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    TESTING = os.environ.get('TESTING', 'False').lower() == 'true'
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-me-in-production')

    # Database settings
    DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///app.db')

    # Static file settings
    STATIC_FOLDER = os.environ.get('STATIC_FOLDER', 'static')

    # Logging settings
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

    # API settings
    API_RATE_LIMIT = int(os.environ.get('API_RATE_LIMIT', '100'))

    @classmethod
    def get_config(cls):
        """Returns configuration dictionary"""
        return {key: getattr(cls, key) for key in dir(cls)
                if not key.startswith('__') and key.isupper()}

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DATABASE_URL = 'sqlite:///:memory:'

# Mapping environment name to config class
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}

# Get current configuration based on environment
FLASK_ENV = os.environ.get('FLASK_ENV', 'production')
current_config = config_by_name.get(FLASK_ENV, ProductionConfig)
