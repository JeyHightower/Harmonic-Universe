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

# Import the app from your app.py file
from app import app

# No need to create app again as it's imported

if __name__ == "__main__":
    # Run the application in development
    port = get_port()
    logger.info(f"Starting development server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
