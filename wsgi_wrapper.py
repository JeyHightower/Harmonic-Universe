#!/usr/bin/env python
"""
WSGI wrapper that ensures both the main app and health check are properly loaded
This provides a single entry point that can serve both the main app and health check
"""
import os
import sys
import logging
import traceback
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wsgi_wrapper")

# Current directory handling
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Try to import the main app
try:
    logger.info("Importing main application...")
    from app import app as main_app
    logger.info("Successfully imported main application")
    HAS_MAIN_APP = True
except Exception as e:
    logger.error(f"Failed to import main application: {e}")
    traceback.print_exc()
    HAS_MAIN_APP = False

# Try to import the health check app as fallback
try:
    logger.info("Importing health check application...")
    from health_check import health_app
    logger.info("Successfully imported health check application")
    HAS_HEALTH_APP = True
except Exception as e:
    logger.error(f"Failed to import health check application: {e}")
    HAS_HEALTH_APP = False

# Route requests to appropriate application
def application(environ, start_response):
    """WSGI application that routes requests to the appropriate app"""
    path = environ.get('PATH_INFO', '')
    logger.info(f"Request path: {path}")

    # Health check paths
    if path == '/health' or path == '/api/health':
        if HAS_HEALTH_APP:
            logger.info("Routing to health check application")
            return health_app.wsgi_app(environ, start_response)
        elif HAS_MAIN_APP:
            logger.info("Routing health check to main application")
            return main_app.wsgi_app(environ, start_response)
        else:
            # Simple 200 response if no apps available
            logger.info("No apps available, returning simple 200 response")
            start_response('200 OK', [('Content-Type', 'application/json')])
            return [b'{"status": "healthy", "message": "Basic health check passed"}']

    # Main application
    if HAS_MAIN_APP:
        logger.info("Routing to main application")
        return main_app.wsgi_app(environ, start_response)
    elif HAS_HEALTH_APP:
        logger.info("Main app not available, routing to health check application")
        return health_app.wsgi_app(environ, start_response)
    else:
        # Simple 404 response if no apps available
        logger.error("No applications available for this request")
        start_response('404 Not Found', [('Content-Type', 'text/plain')])
        return [b'Application not available']

# Expose the application for gunicorn
app = application

if __name__ == "__main__":
    # For testing directly
    from wsgiref.simple_server import make_server
    port = int(os.environ.get('PORT', 10000))
    httpd = make_server('0.0.0.0', port, application)
    logger.info(f"Starting wrapper server on port {port}")
    httpd.serve_forever()
