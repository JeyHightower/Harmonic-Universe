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

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Load from .env file in the current directory
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
        print(f"Loaded environment variables from {env_path}")
    else:
        print(f"Warning: .env file not found at {env_path}")
except ImportError:
    print("python-dotenv not installed. Environment variables may not be loaded properly.")

# Set up development-specific logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log important environment variables for debugging (without revealing sensitive values)
logger.debug(f"DATABASE_URL is {'set' if os.environ.get('DATABASE_URL') else 'NOT SET'}")
logger.debug(f"FLASK_ENV: {os.environ.get('FLASK_ENV', 'not set')}")
logger.debug(f"FLASK_DEBUG: {os.environ.get('FLASK_DEBUG', 'not set')}")

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