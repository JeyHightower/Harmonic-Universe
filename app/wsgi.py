#!/usr/bin/env python
"""
Standalone WSGI application for Render.com.
This file creates a basic Flask application that can run independently.
"""
import os
import sys
import logging
from flask import Flask, jsonify

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.wsgi")
logger.info("Starting standalone app.wsgi module")

# Create a basic Flask application
application = Flask(__name__)

# Add the current directory to the Python path
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to sys.path")

# Print the Python path for debugging
logger.info(f"Python path: {sys.path}")
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Directory contents: {os.listdir('.')}")
if os.path.exists('app'):
    logger.info(f"App directory contents: {os.listdir('app')}")

# Basic routes for health check
@application.route('/')
def home():
    return jsonify({
        "status": "ok",
        "message": "Harmonic Universe application is running"
    })

@application.route('/api/health')
def health():
    return jsonify({
        "status": "ok",
        "message": "Health check passed"
    })

# Try to import the real application if possible
try:
    # First try importing from the root wsgi
    logger.info("Attempting to import from root wsgi.py")
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from wsgi import application as real_app

    # Replace our simple app with the real one
    logger.info("Successfully imported real application from wsgi.py")
    application = real_app

except ImportError as e:
    logger.warning(f"Could not import from wsgi.py: {e}")
    try:
        # Try importing from app.py
        logger.info("Attempting to import from app.py")
        from app import app as real_app
        logger.info("Successfully imported from app.py")
        application = real_app
    except ImportError as e2:
        logger.warning(f"Could not import from app.py: {e2}")
        logger.warning("Using standalone Flask application")

# Make the application available as 'app' as well (some WSGI servers use this name)
app = application

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Running application in development mode on port {port}")
    application.run(host="0.0.0.0", port=port, debug=True)
