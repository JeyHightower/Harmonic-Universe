# This file makes the app directory a Python package
import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app_init")

# Add the parent directory to the path so we can import from the root
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)
logger.info(f"Added {parent_dir} to Python path")

# Import the app from the root app.py
try:
    logger.info("Attempting to import app from app.py")
    from app import app
    logger.info("Successfully imported app from app.py")
except ImportError as e:
    logger.error(f"Error importing app from app.py: {e}")
    from flask import Flask, jsonify
    app = Flask(__name__)
    app.config['DEBUG'] = False

    @app.route('/')
    def index():
        return jsonify({"message": "Fallback app is running. Main app failed to import."})

    @app.route('/api/health')
    def health():
        return jsonify({"status": "unhealthy", "message": "Using fallback app"})

    logger.warning("Created fallback app due to import error")
