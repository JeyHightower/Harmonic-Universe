#!/usr/bin/env python
"""
app_wrapper.py - A wrapper script for the Flask application.
This script is used as the entry point for gunicorn.
It runs fix_imports.py first to ensure all dependencies are available,
then imports and returns the Flask application.
"""
import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app_wrapper")

logger.info("Starting app_wrapper.py...")

# Make sure current directory is in Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Try to run fix_imports.py
try:
    logger.info("Running fix_imports.py...")
    import fix_imports
    logger.info("fix_imports.py completed successfully")
except ImportError:
    logger.warning("Could not import fix_imports.py")
except Exception as e:
    logger.error(f"Error running fix_imports.py: {e}")

# Create a fallback application
from flask import Flask, jsonify

fallback_app = Flask(__name__)

@fallback_app.route('/')
def fallback_index():
    return jsonify({"status": "error", "message": "Main application failed to load"})

@fallback_app.route('/api/health')
def fallback_health():
    return jsonify({"status": "unhealthy", "reason": "Using fallback application"})

# Try to import the main app
try:
    logger.info("Importing main app...")
    from wsgi_app import application
    logger.info("Successfully imported application")
except Exception as e:
    logger.error(f"Error importing app: {e}")
    logger.warning("Using fallback app")
    application = fallback_app

# This is the WSGI application that gunicorn will use
app = application
