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
    # Import the app
    from app import app

    logger.info("Application loaded successfully")
    logger.info(f"PORT environment variable: {os.environ.get('PORT', 'not set')}")

except Exception as e:
    logger.error(f"Error loading application: {str(e)}")
    import traceback
    logger.error(traceback.format_exc())
    raise

if __name__ == "__main__":
    try:
        port = int(os.environ.get("PORT", 10000))
        logger.info(f"Starting application on port {port}")
        app.run(host='0.0.0.0', port=port)
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)

# Add the WSGI application object expected by the standard
application = app
