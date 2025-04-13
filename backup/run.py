"""
Development runner module for the Harmonic Universe backend.

This module is intended for local development only.
For production deployment, use wsgi.py with a WSGI server like Gunicorn.

This module imports and creates the Flask application with debug mode enabled,
making it easier to run and test the application locally.
"""

import os
import logging
import sys

# Add the current directory to Python's path to ensure proper imports
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Set up development-specific logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import the app factory function and create the app
logger.info("Initializing development application")
from app import create_app

# Create the Flask application with development-specific settings
app = create_app(config_name='development')

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting development server on port {port}")
    logger.warning("This is for development only. For production, use wsgi.py with a WSGI server.")
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=True) 