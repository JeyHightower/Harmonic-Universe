"""
Flask application for Harmonic Universe that serves the React frontend

This file serves the React app from the backend/static directory
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

# Try importing the application from the proper module first
try:
    from backend.app import create_app
    logger.info("Successfully imported create_app from backend.app")
except ImportError as e:
    logger.error(f"Error importing from backend.app: {e}")
    
    try:
        # Try importing from just 'app'
        from app import create_app
        logger.info("Successfully imported create_app from app")
    except ImportError:
        logger.critical("Could not import create_app from any known location")
        
        # Create minimal app that serves the React frontend
        from flask import Flask, send_from_directory
        
        def create_app():
            """Create a Flask application that serves the React frontend"""
            # Look for static files in these locations in order of preference
            static_locations = [
                os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend/static'),
                os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend/dist'),
                os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
            ]
            
            # Find the first valid static folder
            static_folder = None
            for location in static_locations:
                if os.path.exists(location):
                    static_folder = location
                    break
            
            # Ensure we have a static folder
            if not static_folder:
                logger.error("No static folder found! App will not be able to serve frontend.")
                static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
                os.makedirs(static_folder, exist_ok=True)
            
            logger.info(f"Using static folder: {static_folder}")
            
            # Create Flask app with the static folder
            app = Flask(__name__, static_folder=static_folder, static_url_path='')
            
            @app.route('/', defaults={'path': ''})
            @app.route('/<path:path>')
            def serve(path):
                if path and static_folder and os.path.exists(os.path.join(static_folder, path)):
                    return send_from_directory(static_folder, path)
                else:
                    # Always serve index.html for SPA routing
                    return send_from_directory(static_folder, 'index.html')
            
            logger.info("Created Flask app serving React frontend")
            return app

# Create the application
app = create_app()

# Only used if running this file directly
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Starting development server on port {port}")
    app.run(host="0.0.0.0", port=port) 