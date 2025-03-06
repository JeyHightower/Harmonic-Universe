#!/usr/bin/env python
# Application factory pattern for gunicorn
import os
import sys
import logging
import traceback
from port import get_port

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wsgi")

logger.info("Loading application in wsgi.py")

# Print detailed debugging information
print("Current directory:", os.getcwd())
print("Python path:", sys.path)

# Add the current directory to Python path to ensure imports work correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
logger.info(f"Added {current_dir} to Python path")

# Check for packages that are installed
try:
    import flask
    logger.info(f"Found Flask: {flask.__version__}")
except ImportError as e:
    logger.error(f"Flask not found: {e}")

try:
    import sqlalchemy
    logger.info(f"Found SQLAlchemy: {sqlalchemy.__version__}")
except ImportError as e:
    logger.error(f"SQLAlchemy not found: {e}")

# Create a fallback app in case the main app fails to import
from flask import Flask, jsonify
fallback_app = Flask(__name__)

@fallback_app.route('/')
def fallback_index():
    return jsonify({"status": "error", "message": "Main application failed to load"})

@fallback_app.route('/api/health')
def fallback_health():
    return jsonify({"status": "unhealthy", "reason": "Fallback app is running because main app failed to load"})

# Monkey patch to prevent flask_migrate imports
from flask_migrate import Migrate  # Make sure this is exactly as shown
logger.info("Imported flask_migrate module")

# Try to import the main app
try:
    logger.info("Attempting to import app...")

    # Try different import approaches
    try:
        # Try importing directly from app module
        logger.info("Trying to import app directly from app.py")
        from app import app
        logger.info("Successfully imported app from app.py")
    except ImportError as app_import_error:
        logger.error(f"Error importing from app.py: {app_import_error}")
        logger.error(traceback.format_exc())

        try:
            # Try importing from app package
            logger.info("Trying to import app from app package")
            from app import app
            logger.info("Successfully imported app from app package")
        except ImportError as pkg_import_error:
            logger.error(f"Error importing from app package: {pkg_import_error}")
            logger.error(traceback.format_exc())
            raise

except Exception as e:
    logger.error(f"Error importing app: {e}")
    logger.error(traceback.format_exc())
    logger.warning("Using fallback app")
    app = fallback_app

# Add the WSGI application object expected by the standard
application = app

if __name__ == "__main__":
    try:
        port = int(os.environ.get("PORT", 10000))
        logger.info(f"Starting application on port {port}")
        app.run(host='0.0.0.0', port=port)
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        logger.error(traceback.format_exc())
        sys.exit(1)
