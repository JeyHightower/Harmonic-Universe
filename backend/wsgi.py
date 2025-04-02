# WSGI entry point for Harmonic Universe backend

"""
This file serves as a WSGI entry point for the Flask application.
It attempts to load the Flask app using various methods and provides fallbacks.
"""

import os
import sys
import logging
from flask import Flask, send_from_directory, jsonify, request

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Print diagnostic information
logger.info("Python version: %s", sys.version)
logger.info("Current directory: %s", os.getcwd())
logger.info("Directory contents: %s", os.listdir('.'))
if os.path.exists('backend'):
    logger.info("Backend directory contents: %s", os.listdir('backend'))
if os.path.exists('static'):
    logger.info("Static directory contents: %s", os.listdir('static'))

try:
    # First attempt: try to import from backend.app
    logger.info("Attempting to import from backend.app")
    sys.path.insert(0, os.path.abspath('.'))
    from backend.app import create_app
    logger.info("Successfully imported create_app from backend.app")
    app = create_app()
except Exception as e:
    logger.error("Failed to import from backend.app: %s", str(e))
    try:
        # Second attempt: try to import directly from app
        logger.info("Attempting to import from app")
        from app import create_app
        logger.info("Successfully imported create_app from app")
        app = create_app()
    except Exception as e:
        logger.error("Failed to import from app: %s", str(e))
        # Fallback: Create a minimal Flask app
        logger.info("Creating fallback Flask app")
        app = Flask(__name__, static_folder='static')
        
        @app.route('/api/health')
        def health():
            return jsonify({"status": "ok", "message": "Fallback app is running"})

# Add a route to serve the index.html file from static directory
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    logger.info(f"Received request for path: {path}")
    static_dir = app.static_folder or 'static'  # Default to 'static' if None
    logger.info(f"Static directory is: {static_dir}")
    
    # Log static directory contents for debugging
    try:
        static_files = os.listdir(static_dir)
        logger.info(f"Static directory contains {len(static_files)} files")
        if 'index.html' in static_files:
            logger.info("index.html exists in static directory")
        else:
            logger.error("index.html NOT FOUND in static directory")
            
        # Check for main JS files
        js_files = [f for f in static_files if f.endswith('.js') or 'assets' in static_files]
        logger.info(f"Found {len(js_files)} JS files or asset directories")
    except Exception as e:
        logger.error(f"Error reading static directory: {e}")
    
    # If path has an extension, try to serve it directly
    if '.' in path:
        file_path = os.path.join(static_dir, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            logger.info(f"Serving file directly: {path}")
            return send_from_directory(static_dir, path)
        else:
            logger.warning(f"File not found: {path}")
            # Try different paths before giving up
            # Remove leading slash if it exists
            alt_path = path[1:] if path.startswith('/') else path
            if os.path.exists(os.path.join(static_dir, alt_path)):
                logger.info(f"Serving alternate path: {alt_path}")
                return send_from_directory(static_dir, alt_path)
                
            # Check if the file exists in assets directory
            assets_path = os.path.join('assets', path)
            if os.path.exists(os.path.join(static_dir, assets_path)):
                logger.info(f"Serving from assets: {assets_path}")
                return send_from_directory(static_dir, assets_path)
    
    # If path is empty or doesn't exist, serve index.html
    if not path or not os.path.exists(os.path.join(static_dir, path)):
        logger.info(f"Serving index.html for path: {path}")
        return send_from_directory(static_dir, 'index.html')
    
    # Otherwise serve the requested file
    logger.info(f"Serving file: {path}")
    return send_from_directory(static_dir, path)

# Add an error handler for 404 errors
@app.errorhandler(404)
def not_found(e):
    logger.error(f"404 error: {request.path}")
    static_dir = app.static_folder or 'static'  # Default to 'static' if None
    return send_from_directory(static_dir, 'index.html')

# Add explicit debugging endpoint
@app.route('/debug')
def debug_info():
    info = {
        'python_version': sys.version,
        'current_dir': os.getcwd(),
        'dir_contents': os.listdir('.'),
        'static_dir': app.static_folder,
        'static_exists': os.path.exists(app.static_folder) if app.static_folder else False,
        'static_contents': os.listdir(app.static_folder) if app.static_folder and os.path.exists(app.static_folder) else 'Not found',
        'environment': {k: v for k, v in os.environ.items() if not k.startswith('_')}
    }
    return jsonify(info)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 