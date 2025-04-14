#!/usr/bin/env python
"""
WSGI entry point for Harmonic Universe backend

This file serves as the WSGI entry point for the Flask application for production deployment.
It uses the create_app function from app/__init__.py to initialize the application.
"""

import os
import logging
import sys
import traceback
from pathlib import Path

# Load environment variables from .env file early
try:
    from dotenv import load_dotenv
    dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path)
        print(f"Loaded environment variables from {dotenv_path}")
    else:
        print(f"Warning: No .env file found at {dotenv_path}")
except ImportError:
    print("Warning: python-dotenv not installed. Environment variables may not be loaded properly.")

# Configure Python's import path to include relevant directories
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, BASE_DIR)
# Remove the incorrect import path
# sys.path.insert(0, os.path.join(BASE_DIR, 'backend'))

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log startup information
logger.info("Starting Harmonic Universe WSGI application")
logger.info(f"Python version: {sys.version}")
logger.info(f"Current working directory: {os.getcwd()}")
logger.info(f"sys.path: {sys.path}")

# Check if Flask is installed
try:
    import flask
    from importlib.metadata import version
    logger.info(f"Flask is installed (version {version('flask')})")
except ImportError:
    logger.critical("Flask is not installed! Please install using the virtual environment:")
    logger.critical("python -m venv venv")
    logger.critical("source venv/bin/activate")
    logger.critical("pip install flask")
    logger.critical("Then run this script again from within the activated virtual environment.")
    sys.exit(1)

# Import the app factory function and create the application
application = None
try:
    try:
        # Try importing directly from app instead of backend.app
        from app import create_app
        logger.info("Using direct import path (app)")
    except ImportError as e:
        logger.warning(f"Could not import from app: {e}")
        
        # Try an alternative import path
        logger.error("Cannot import create_app from any location")
        raise
    
    # Create the application
    application = create_app()
    
except Exception as e:
    logger.critical(f"Failed to create application: {e}")
    logger.critical(traceback.format_exc())
    
    # Create an app that serves the React frontend directly
    from flask import Flask, send_from_directory
    
    def create_direct_frontend_app():
        # Find the static directory
        static_locations = [
            os.path.join(BASE_DIR, 'static'),
            os.path.join(BASE_DIR, '..', 'frontend', 'dist'),
            os.path.join(BASE_DIR, '..', 'static')
        ]
        
        # Choose the first valid location
        static_folder = None
        for loc in static_locations:
            if os.path.exists(loc):
                static_folder = loc
                logger.info(f"Found static files at: {loc}")
                break
        
        if not static_folder:
            logger.error("No static folder found, creating one...")
            static_folder = os.path.join(BASE_DIR, 'static')
            os.makedirs(static_folder, exist_ok=True)
        
        # Create a simple Flask app that serves the frontend
        app = Flask(__name__, static_folder=static_folder, static_url_path='')
        
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve(path):
            # For SPA routing, serve index.html for routes that don't exist
            if path and os.path.exists(os.path.join(static_folder, path)):
                return send_from_directory(static_folder, path)
            else:
                return send_from_directory(static_folder, 'index.html')
        
        logger.info(f"Created direct frontend app using {static_folder}")
        return app
    
    application = create_direct_frontend_app()

# This is what Gunicorn will import
app = application

# Development server (not used in production)
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting development server on port {port} (NOT RECOMMENDED FOR PRODUCTION)")
    app.run(host='0.0.0.0', port=port) 