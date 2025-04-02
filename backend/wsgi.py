# WSGI entry point for Harmonic Universe backend

"""
This file serves as a WSGI entry point for the Flask application.
It attempts to load the Flask app using various methods and provides fallbacks.
"""

import os
import sys
import logging
from flask import Flask, send_from_directory, jsonify, request

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log startup information
logger.info("Starting Harmonic Universe WSGI application")
logger.info(f"Python version: {sys.version}")
logger.info(f"Current directory: {os.getcwd()}")

try:
    # First attempt: try to import from backend.app
    logger.info("Attempting to import from backend.app")
    from backend.app import create_app
    logger.info("Successfully imported create_app from backend.app")
    app = create_app()
except ImportError as e:
    logger.error("Failed to import from backend.app: %s", str(e))
    try:
        # Second attempt: try to import directly from app
        logger.info("Attempting to import from app")
        from app import create_app
        logger.info("Successfully imported create_app from app")
        app = create_app()
    except ImportError as e:
        logger.error("Failed to import from app: %s", str(e))
        # Create a minimal app as fallback
        logger.info("Creating minimal Flask app as fallback")
        static_folder = os.path.join(os.path.dirname(__file__), 'static')
        app = Flask(__name__, static_folder=static_folder)

# Ensure health check endpoint exists
@app.route('/api/health')
def health_check():
    """Health check endpoint for Render.com"""
    return jsonify({"status": "ok"})

# Serve frontend app at root
@app.route('/')
def serve_index():
    if app.static_folder and os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')
    return jsonify({"error": "index.html not found"}), 404

# Serve static files
@app.route('/<path:path>')
def serve_static(path):
    # Check if the path exists in the static folder
    if app.static_folder and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    
    # Otherwise serve index.html to support SPA routing
    if app.static_folder and os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')
    
    return jsonify({"error": "file not found"}), 404

# Development server (not used in production)
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 