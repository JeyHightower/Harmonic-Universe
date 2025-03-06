#!/usr/bin/env python
import os
import logging
from port import get_port

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wsgi_app")

# Try to import psycopg2 and log version info for debugging
try:
    import psycopg2
    logger.info(f"Using psycopg2 version: {psycopg2.__version__}")
except ImportError:
    logger.error("Failed to import psycopg2. Check if it's installed correctly.")
except Exception as e:
    logger.error(f"Error importing psycopg2: {str(e)}")

try:
    from app import create_app
    # Create the application
    application = create_app()
    logger.info("Application created successfully")
except Exception as e:
    logger.error(f"Error creating application: {str(e)}")
    from flask import Flask, jsonify
    # Create a fallback application
    application = Flask(__name__)

    @application.route('/')
    def fallback_index():
        return jsonify({"status": "error", "message": "Application failed to initialize properly"})

    @application.route('/api/health')
    def fallback_health():
        return jsonify({"status": "unhealthy", "reason": "Application initialization failed"})

    logger.warning("Using fallback application due to initialization error")

if __name__ == "__main__":
    # Run the application
    port = get_port()
    application.run(host="0.0.0.0", port=port, debug=True)
