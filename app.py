"""
Fallback Flask application for Harmonic Universe

This file provides a minimal working Flask application in case 
the main backend/app module cannot be imported correctly.
"""

import os
import logging
import sys

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.warning("app.py is deprecated; use run.py (development) or wsgi.py (production) instead")

# Try importing the application from the proper module first
try:
    from backend.app import create_app
    logger.info("Successfully imported create_app from backend.app")
except ImportError as e:
    logger.error(f"Error importing from backend.app: {e}")
    
    try:
        # If we're here, backend.app failed, so we might be in a different structure
        # Try importing from just 'app'
        from app import create_app
        logger.info("Successfully imported create_app from app")
    except ImportError:
        logger.critical("Could not import create_app from any known location")
        
        # Provide a minimal fallback for create_app
        from flask import Flask, jsonify
        
        def create_app():
            """
            Create a minimal Flask application as a fallback
            """
            app = Flask(__name__)
            
            @app.route('/')
            def home():
                return jsonify({
                    "status": "maintenance",
                    "message": "The application is currently in maintenance mode. Please check back later."
                })
                
            @app.route('/health')
            def health():
                return jsonify({"status": "ok", "message": "Fallback application is working"})
            
            @app.route('/api')
            def api_root():
                return jsonify({
                    "api": "Harmonic Universe API",
                    "version": "fallback",
                    "status": "limited functionality",
                    "endpoints": ["/", "/health", "/api"]
                })
            
            logger.info("Created fallback application")
            return app

# Create the application
application = create_app()

# This variable is used by Gunicorn
app = application

# Only used if running this file directly
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Starting development server on port {port}")
    app.run(host="0.0.0.0", port=port) 