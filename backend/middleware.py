import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log_request_errors(wsgi_app):
    """Middleware to log request details when errors occur"""
    def middleware(environ, start_response):
        path = environ.get('PATH_INFO', '')

        # Define a custom start_response to catch errors
        def custom_start_response(status, headers, exc_info=None):
            # Log error details for 500 responses
            if status.startswith('500'):
                logger.error(f"500 Error on path: {path}")
                logger.error(f"Request method: {environ.get('REQUEST_METHOD')}")
                if exc_info:
                    logger.error(f"Exception: {exc_info[1]}")
                    logger.error(traceback.format_exception(*exc_info))
            return start_response(status, headers, exc_info)

        # Return the WSGI app with our custom start_response
        return wsgi_app(environ, custom_start_response)

    return middleware
