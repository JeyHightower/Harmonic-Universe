#!/usr/bin/env python
# Application factory pattern for gunicorn
import os
import sys
import logging
from port import get_port

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wsgi")

logger.info("Loading application in wsgi.py")

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Log environment information
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Python path: {sys.path}")

# Try to import psycopg2 and log version info for debugging
try:
    import psycopg2
    logger.info(f"Using psycopg2 version: {psycopg2.__version__}")
except ImportError:
    logger.error("Failed to import psycopg2. Check if it's installed correctly.")
except Exception as e:
    logger.error(f"Error importing psycopg2: {str(e)}")

# Import dependencies to verify they're installed
try:
    logger.info(f"Found Flask: {__import__('flask').__version__}")
    logger.info(f"Found SQLAlchemy: {__import__('sqlalchemy').__version__}")
    from flask_migrate import Migrate
    logger.info("Successfully imported Flask-Migrate")
except ImportError as e:
    logger.error(f"Failed to import required dependencies: {e}")
except Exception as e:
    logger.error(f"Error verifying dependencies: {e}")

# Create the application
try:
    # Import from wsgi_app instead of creating a new instance
    from wsgi_app import application
    logger.info("Application imported successfully from wsgi_app.py")
except Exception as e:
    logger.error(f"Error importing application from wsgi_app: {e}")
    try:
        # Try the direct approach if importing fails
        from app import create_app
        application = create_app()
        logger.info("Application created directly from app package")
    except Exception as e:
        logger.error(f"Error creating application directly: {e}")
        from flask import Flask, jsonify
        application = Flask(__name__)

        @application.route('/')
        def error():
            return jsonify({'status': 'error', 'message': 'Application failed to load correctly'})

        @application.route('/api/health')
        def health():
            return jsonify({'status': 'unhealthy', 'reason': 'Application failed to initialize'})

        logger.warning("Using fallback Flask application due to initialization errors")

# This is the WSGI entry point that gunicorn will use
app = application

if __name__ == "__main__":
    port = get_port()
    application.run(host="0.0.0.0", port=port)
