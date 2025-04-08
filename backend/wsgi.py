"""
WSGI entry point for Harmonic Universe backend

This file serves as the main WSGI entry point for the Flask application
in all environments (development, testing, and production).
It uses the create_app function from app/__init__.py to initialize the application.
"""

import os
import sys
import logging

# Set up logging based on environment
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log startup information
logger.info("Starting Harmonic Universe application")

# Import the app factory function and create the application
from app import create_app

# Get the environment from environment variable or use development as default
flask_env = os.environ.get('FLASK_ENV', 'development')
application = create_app(flask_env)

# This is what Gunicorn will import
app = application

# Development server
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    logger.info(f"Starting development server on port {port} (debug={debug})")
    app.run(host='0.0.0.0', port=port, debug=debug) 