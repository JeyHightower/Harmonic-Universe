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

# Create a simple fallback app in case the main app fails to load
def create_fallback_app():
    from flask import Flask, jsonify, redirect, url_for
    import os
    
    # Create a simple app that doesn't try to serve static files
    app = Flask(__name__)
    
    @app.route('/')
    def home():
        return jsonify({
            "status": "running", 
            "message": "The application is running, but in fallback mode.",
            "api_endpoints": ["/api", "/health"]
        })
    
    @app.route('/health')
    def health():
        return jsonify({
            "status": "ok",
            "message": "Fallback application is working"
        })
    
    @app.route('/api')
    def api_root():
        return jsonify({
            "api": "Harmonic Universe API",
            "version": "fallback",
            "status": "limited functionality"
        })
    
    # All other routes redirect to home
    @app.route('/<path:path>')
    def catch_all(path):
        if path.startswith('api/'):
            return jsonify({"error": "API endpoint not available in fallback mode"}), 404
        return redirect(url_for('home'))
    
    return app

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
    
    # Create a minimal fallback application
    logger.warning("Creating fallback application...")
    application = create_fallback_app()

# This is what Gunicorn will import
app = application

# Development server (not used in production)
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting development server on port {port} (NOT RECOMMENDED FOR PRODUCTION)")
    app.run(host='0.0.0.0', port=port) 