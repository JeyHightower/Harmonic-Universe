#!/usr/bin/env python
import logging
from port import get_port

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("run")

try:
    # Import the application from wsgi_app.py
    from wsgi_app import application
    logger.info("Successfully imported application")

    if __name__ == '__main__':
        port = get_port()
        logger.info(f"Starting application on port {port}")
        application.run(host='0.0.0.0', port=port, debug=True)
except Exception as e:
    logger.error(f"Error running application: {str(e)}")
    import sys
    sys.exit(1)
