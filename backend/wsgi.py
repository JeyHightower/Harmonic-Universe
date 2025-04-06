"""
WSGI entry point for Harmonic Universe backend

This file serves as the WSGI entry point for the Flask application.
It uses the create_app function from app/__init__.py to initialize the application.
"""

import os
import sys
import logging
from typing import cast

# Add the current directory to Python's path to ensure proper imports
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log startup information
logger.info("Starting Harmonic Universe WSGI application")

# Import the app factory function and create the application
try:
    # Try direct import
    from app import create_app
    logger.info("Using direct import path for app")
except ImportError:
    try:
        # Try relative import
        from .app import create_app
        logger.info("Using relative import path for app")
    except ImportError:
        # Try with full path
        try:
            from backend.app import create_app
            logger.info("Using backend.app import path")
        except ImportError:
            logger.critical("Failed to import create_app from any known location")
            raise

# Create the application using the factory function
application = create_app()

# Log static folder information
static_folder = cast(str, application.static_folder)
logger.info(f"Using static folder: {static_folder}")
if static_folder and os.path.exists(static_folder):
    files = os.listdir(static_folder)
    logger.info(f"Static folder contains {len(files)} files")
    if 'index.html' in files:
        logger.info("index.html found in static folder")
    else:
        logger.warning("index.html NOT found in static folder")
else:
    logger.warning(f"Static folder does not exist or is None: {static_folder}")

# This is what Gunicorn will import
app = application

# Development server (not used in production)
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 