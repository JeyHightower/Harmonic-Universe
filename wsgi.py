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

try:
    # Try to import the app directly first
    try:
        from app import app
        logger.info("Successfully imported app directly")
    except ImportError:
        # If that fails, try importing the create_app function
        logger.info("Direct import failed, trying to import create_app")
        from app import create_app
        app = create_app()
        logger.info("Created app using create_app()")

    # Check if static folder exists
    static_folder = 'static'
    if os.path.exists(static_folder):
        files = os.listdir(static_folder)
        logger.info(f"Static folder exists with {len(files)} files")
    else:
        logger.warning(f"Static folder doesn't exist: {static_folder}")
        os.makedirs(static_folder, exist_ok=True)
        logger.info(f"Created static folder: {static_folder}")

    logger.info("Application loaded successfully")

except Exception as e:
    logger.error(f"Error loading application: {str(e)}")
    import traceback
    logger.error(traceback.format_exc())
    raise

if __name__ == "__main__":
    try:
        port = get_port()
        logger.info(f"Starting application on port {port}")
        app.run(host='0.0.0.0', port=port)
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)

# Add the WSGI application object expected by the standard
application = app
