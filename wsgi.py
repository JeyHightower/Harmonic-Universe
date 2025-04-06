"""
WSGI entry point for Harmonic Universe backend

This file serves as the WSGI entry point for the Flask application for production deployment.
It uses the create_app function from app/__init__.py to initialize the application.
"""

import os
import logging
import sys

# Add the current directory to Python's path to ensure proper imports
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log startup information
logger.info("Starting Harmonic Universe WSGI application")

# Import the app factory function and create the application
# Try import path for production (render.com), fall back to local development path
try:
    from backend.app import create_app
    logger.info("Using production import path")
except ImportError:
    try:
        from app import create_app
        logger.info("Using local development import path")
    except ImportError:
        logger.critical("Could not import create_app from any known location")
        raise

application = create_app()

# This is what Gunicorn will import
app = application

# Development server (not used in production)
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting development server on port {port} (NOT RECOMMENDED FOR PRODUCTION)")
    app.run(host='0.0.0.0', port=port) 