import os
import secrets
from typing import Optional

class Config:
    # Database
    DB_HOST: str = os.getenv('DB_HOST', 'localhost')
    DB_PORT: int = int(os.getenv('DB_PORT', 5432))
    DB_NAME: str = os.getenv('DB_NAME', 'harmonic_universe')
    DB_USER: str = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD: str = os.getenv('DB_PASSWORD', 'postgres')

    # Construct database URL
    DATABASE_URL: str = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    # Redis configuration
    REDIS_URL: str = os.getenv('REDIS_URL', 'redis://localhost:6379')

    # Security
    SECRET_KEY: str = os.getenv('SECRET_KEY', secrets.token_urlsafe(32))

    # Application
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() in ('true', '1', 't')
    TESTING: bool = os.getenv('TESTING', 'False').lower() in ('true', '1', 't')

config = Config()
