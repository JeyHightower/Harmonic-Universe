import os
import logging

class Config:
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev')
    
    # Database settings
    SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'max_overflow': 2,
        'pool_timeout': 30,
        'pool_recycle': 1800,
    }
    
    # Security settings
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    
    # CORS settings
    CORS_HEADERS = 'Content-Type'
    
    # File upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
    
    # Rate limiting
    RATELIMIT_DEFAULT = "200 per day"
    
    # Logging configuration
    LOG_LEVEL = logging.DEBUG if os.getenv('FLASK_ENV') == 'development' else logging.INFO
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = 'app.log' 