"""
Root-level app.py to fix import issues on Render.com
This file provides a clean entry point for gunicorn
"""
import os
import sys
import glob
import logging
from flask import Flask, send_from_directory, current_app, make_response, jsonify, request, abort

# Add the current directory to Python path to ensure imports work correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """
    Factory function that creates and returns the Flask application.
    This avoids circular imports by importing the actual app inside the function.
    """
    try:
        # Determine the absolute path to the static folder
        static_folder = os.path.abspath('static')
        logger.info(f"Static folder path: {static_folder}")

        # Verify static folder exists
        if not os.path.exists(static_folder):
            logger.warning(f"Static folder does not exist at {static_folder}, creating it")
            os.makedirs(static_folder, exist_ok=True)

        # List contents of static folder for debugging
        if os.path.exists(static_folder):
            logger.info(f"Static folder contents: {os.listdir(static_folder)}")

        # Create Flask app with explicit static folder
        app = Flask(__name__,
                    static_folder=static_folder,
                    static_url_path='')

        # Enable debug mode for more verbose errors
        app.config['DEBUG'] = True

        # Define a direct health check endpoint at the root level
        @app.route('/api/health')
        def health_check():
            logger.info("Health check endpoint accessed")
            return jsonify({
                "status": "ok",
                "message": "API is working",
                "static_folder": static_folder,
                "static_files_exist": os.path.exists(static_folder),
                "static_files": os.listdir(static_folder) if os.path.exists(static_folder) else []
            })

        # Also define the v1 health check endpoint for compatibility
        @app.route('/api/v1/health')
        def v1_health_check():
            logger.info("V1 health check endpoint accessed")
            return jsonify({
                "status": "healthy",
                "message": "Harmonic Universe API v1 is running"
            })

        # Direct asset serving route
        @app.route('/assets/<path:filename>')
        def serve_assets(filename):
            asset_path = os.path.join(static_folder, 'assets')
            logger.info(f"Serving asset: {filename} from {asset_path}")
            return send_from_directory(asset_path, filename)

        # Serve static files or SPA index.html
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve(path):
            logger.info(f"Request for path: {path}")

            # Handle root path
            if not path:
                logger.info("Serving index.html for root path")
                index_path = os.path.join(static_folder, 'index.html')
                if os.path.exists(index_path):
                    return send_from_directory(static_folder, 'index.html')
                else:
                    logger.warning("index.html not found, serving fallback.html")
                    fallback_path = os.path.join(static_folder, 'fallback.html')
                    if os.path.exists(fallback_path):
                        return send_from_directory(static_folder, 'fallback.html')

            # Check if the file exists in the static folder
            static_file_path = os.path.join(static_folder, path)
            if os.path.exists(static_file_path) and os.path.isfile(static_file_path):
                logger.info(f"Serving static file: {path}")
                return send_from_directory(static_folder, path)

            # For all other paths, serve index.html for SPA routing
            try:
                logger.info(f"Serving index.html for SPA route: {path}")
                index_path = os.path.join(static_folder, 'index.html')
                if os.path.exists(index_path):
                    return send_from_directory(static_folder, 'index.html')
                else:
                    logger.warning("index.html not found for SPA route, serving fallback.html")
                    fallback_path = os.path.join(static_folder, 'fallback.html')
                    if os.path.exists(fallback_path):
                        return send_from_directory(static_folder, 'fallback.html')
            except Exception as e:
                logger.error(f"Error serving for path {path}: {str(e)}")
                # Fallback if both index.html and fallback.html don't exist
                return f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Harmonic Universe - Service Error</title>
                    <style>
                        body {{ font-family: sans-serif; margin: 40px; line-height: 1.6; }}
                        .container {{ max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Harmonic Universe</h1>
                        <p>The application's static files could not be found.</p>
                        <p>Requested path: {path}</p>
                        <p>Error: {str(e)}</p>
                        <p>Static folder: {static_folder}</p>
                        <p>Static files exist: {os.path.exists(static_folder)}</p>
                        <p>Static files: {os.listdir(static_folder) if os.path.exists(static_folder) else []}</p>
                    </div>
                </body>
                </html>
                """, 500

        # Now try to import and use the backend app
        try:
            from backend.app import create_app as backend_create_app
            from backend.app.core.config import config
            from backend.middleware import log_request_errors

            # Register backend routes
            logger.info("Importing backend routes")
            from backend.app.api import api_bp
            app.register_blueprint(api_bp, url_prefix='/api/v1')

            # Initialize middleware
            log_request_errors(app)

            logger.info("Backend routes successfully registered")
        except Exception as e:
            logger.warning(f"Could not import backend app: {str(e)}")
            logger.warning("Continuing with minimal Flask app")

        return app
    except Exception as e:
        import traceback
        logger.error(f"Error creating app: {e}")
        logger.error(traceback.format_exc())

        # Create a minimal emergency app if everything else fails
        minimal_app = Flask(__name__)

        @minimal_app.route('/')
        def minimal_index():
            return "Minimal emergency Flask app is running. There was an error creating the full app."

        @minimal_app.route('/api/health')
        def minimal_health():
            return jsonify({
                "status": "degraded",
                "message": "Minimal emergency app is running due to errors",
                "error": str(e)
            })

        return minimal_app

# Optional: Allow direct execution of this file
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
