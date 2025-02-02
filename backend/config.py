import os

SECRET_KEY: str = os.getenv('SECRET_KEY', secrets.token_urlsafe(32))
