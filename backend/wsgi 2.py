"""
WSGI entry point for Harmonic Universe backend

This file serves as the WSGI entry point for the Flask application.
It uses the create_app function from app/__init__.py to initialize the application.
"""

import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log startup information
logger.info("Starting Harmonic Universe WSGI application")

# Import the app factory function and create the application
from app import create_app
application = create_app()

# This is what Gunicorn will import
app = application

# Development server (not used in production)
if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 