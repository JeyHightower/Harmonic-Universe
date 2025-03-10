#!/usr/bin/env python
"""
Ultra-simple WSGI entry point for Render.com.
This file is a backup in case other approaches fail.
"""
import os
import sys
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Starting simplified WSGI module")

# Add the current directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to sys.path")

# Try to import the application from various possible locations
try:
    # Try importing from main wsgi file
    logger.info("Trying to import from wsgi.py")
    from wsgi import application
    logger.info("Successfully imported application from wsgi.py")
except ImportError:
    logger.warning("Failed to import from wsgi.py, trying app.py")
    try:
        # Try importing from app.py
        from app import app as application
        logger.info("Successfully imported application from app.py")
    except ImportError:
        logger.error("Failed to import application from app.py")
        # Last resort - create a simple Flask app
        try:
            logger.warning("Creating emergency Flask application")
            from flask import Flask, jsonify

            application = Flask(__name__)

            @application.route('/')
            def home():
                return jsonify({
                    "status": "error",
                    "message": "Emergency WSGI application running. The main application failed to load."
                })

            @application.route('/api/health')
            def health():
                return jsonify({"status": "ok", "message": "Emergency health check endpoint"})

            logger.info("Created emergency Flask application")
        except Exception as e:
            logger.critical(f"Failed to create emergency application: {e}")
            raise

# Make the application available as 'app' as well
app = application

if __name__ == "__main__":
    logger.info("Running application in development mode")
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), debug=True)
