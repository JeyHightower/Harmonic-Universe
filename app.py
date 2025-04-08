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
        from flask import Flask, jsonify, send_from_directory
        
        def create_app():
            """
            Create a minimal Flask application as a fallback
            """
            # Find the static folder - prioritize frontend/dist then backend/static
            static_path = None
            for path in ['frontend/dist', 'backend/static', 'static']:
                full_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), path)
                if os.path.exists(full_path):
                    static_path = full_path
                    break
            
            if static_path is None:
                # Create a minimal static folder if none exists
                static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
                os.makedirs(static_path, exist_ok=True)
                
                # Create a basic index.html file
                with open(os.path.join(static_path, 'index.html'), 'w') as f:
                    f.write("""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Harmonic Universe</title>
                        <style>
                            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                            h1 { color: #4a90e2; }
                        </style>
                    </head>
                    <body>
                        <h1>Harmonic Universe</h1>
                        <p>The application is running in fallback mode.</p>
                    </body>
                    </html>
                    """)
            
            app = Flask(__name__, static_folder=static_path, static_url_path='')
            
            @app.route('/')
            def home():
                return app.send_static_file('index.html')
                
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
            
            # Handle SPA routing - return index.html for any unknown routes that aren't API routes
            @app.route('/<path:path>')
            def catch_all(path):
                if path.startswith('api/'):
                    return jsonify({"error": "API endpoint not found"}), 404
                try:
                    return app.send_static_file(path)
                except:
                    return app.send_static_file('index.html')
            
            logger.info(f"Created fallback application with static folder at {static_path}")
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