"""
WSGI entry point for Harmonic Universe backend

This file serves as the WSGI entry point for the Flask application for production deployment.
It uses the create_app function from app/__init__.py to initialize the application.
"""

import os
import logging
import sys
import traceback

# Configure Python's import path to include relevant directories
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, 'backend'))

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
    logger.info(f"Flask is installed (version {flask.__version__})")
except ImportError:
    logger.critical("Flask is not installed! Installing now...")
    import subprocess
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "flask"])
        import flask
        logger.info(f"Successfully installed Flask version {flask.__version__}")
    except Exception as e:
        logger.critical(f"Failed to install Flask: {e}")
        raise

# Import the app factory function and create the application
application = None
try:
    try:
        # Try the production import path first
        from backend.app import create_app
        logger.info("Using production import path (backend.app)")
    except ImportError as e:
        logger.warning(f"Could not import from backend.app: {e}")
        
        # Try the direct import path
        from app import create_app
        logger.info("Using direct import path (app)")
    
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
            os.path.join(BASE_DIR, 'backend/static'),
            os.path.join(BASE_DIR, 'frontend/dist'),
            os.path.join(BASE_DIR, 'static')
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
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting development server on port {port} (NOT RECOMMENDED FOR PRODUCTION)")
    app.run(host='0.0.0.0', port=port) 