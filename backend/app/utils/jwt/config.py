"""
JWT Configuration Management

This module handles JWT configuration settings and secret key management.
"""

import os
from flask import current_app
from datetime import timedelta

def get_jwt_secret_key(app=None) -> str:
    """
    Get the JWT secret key from config or environment variables.
    Ensures consistent access to the secret key across the application.
    
    Args:
        app: Optional Flask application instance. If not provided, uses current_app.
    
    Returns:
        str: The JWT secret key
    """
    config = app.config if app else current_app.config
    secret_key = config.get('JWT_SECRET_KEY')
    if not secret_key:
        secret_key = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
        # Store in config for consistency
        if app:
            app.config['JWT_SECRET_KEY'] = secret_key
        else:
            current_app.config['JWT_SECRET_KEY'] = secret_key
    return secret_key

def get_jwt_refresh_secret_key(app=None) -> str:
    """
    Get the JWT refresh secret key from config or environment variables.
    If no specific refresh key is found, falls back to the access token secret key.
    
    Args:
        app: Optional Flask application instance. If not provided, uses current_app.
    
    Returns:
        str: The JWT refresh secret key
    """
    config = app.config if app else current_app.config
    # First check if a specific refresh key exists
    refresh_key = config.get('JWT_REFRESH_SECRET_KEY')
    if not refresh_key:
        refresh_key = os.environ.get('JWT_REFRESH_SECRET_KEY')
    
    # If no specific refresh key, use the access token key
    if not refresh_key:
        refresh_key = get_jwt_secret_key(app)
        
    return refresh_key

def configure_jwt(app) -> None:
    """
    Configure JWT settings for the application.
    
    Args:
        app: The Flask application instance
    """
    # Set the JWT secret key
    app.config['JWT_SECRET_KEY'] = get_jwt_secret_key(app)
    
    # Configure token expiration
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    
    # Configure other JWT settings
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    
    # Log configuration in development
    if app.config.get('ENV') == 'development':
        app.logger.info('JWT Configuration:')
        app.logger.info(f'- Secret Key (first 3 chars): {app.config["JWT_SECRET_KEY"][:3]}...')
        app.logger.info(f'- Access Token Expires: {app.config["JWT_ACCESS_TOKEN_EXPIRES"]}')
        app.logger.info(f'- Refresh Token Expires: {app.config["JWT_REFRESH_TOKEN_EXPIRES"]}') 