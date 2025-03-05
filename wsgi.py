#!/usr/bin/env python
# Application factory pattern for gunicorn
import os
import sys

# Add the current directory to Python path to ensure imports work correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up basic logging for debugging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import the app with proper error handling
try:
    # First try to import from root app.py
    from app import create_app
    logger.info("Successfully imported create_app from root app.py")
    app = create_app()
except Exception as e:
    logger.error(f"Error importing from root app.py: {str(e)}")
    try:
        # Fall back to backend app if root app fails
        from backend.app import create_app as backend_create_app
        logger.info("Successfully imported create_app from backend.app")
        app = backend_create_app()
    except Exception as e:
        logger.error(f"Error importing from backend.app: {str(e)}")
        raise

# Log static folder path for debugging
if hasattr(app, 'static_folder'):
    logger.info(f"App static folder: {app.static_folder}")
    logger.info(f"Static folder exists: {os.path.exists(app.static_folder)}")
    if os.path.exists(app.static_folder):
        logger.info(f"Static folder contents: {os.listdir(app.static_folder)}")

if __name__ == "__main__":
    # Use environment variable PORT if available
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting app on port {port}")
    app.run(debug=True, host='0.0.0.0', port=port)
