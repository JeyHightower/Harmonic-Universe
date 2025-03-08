#!/usr/bin/env python
"""
WSGI entry point for Gunicorn.
This file imports and exposes the Flask application using the standard pattern.
"""
import os
import logging
import time
from flask import request

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import the create_app function
from app import create_app

# Create the Flask application
app = create_app()

# Load the HTML fallback script
try:
    from html_fallback import add_html_fallback_routes
    logger.info("Loading HTML fallback routes")
    app = add_html_fallback_routes(app)
    logger.info("HTML fallback routes loaded successfully")
except Exception as e:
    logger.error(f"Failed to load HTML fallback routes: {e}")

# Add middleware to ensure proper content-length and debug response issues
@app.after_request
def add_content_length(response):
    """
    Add Content-Length header to responses if missing and log response details.
    This helps diagnose issues with empty responses.
    """
    # Log response details for debugging
    logger.info(f"Response: status={response.status_code}, mimetype={response.mimetype}, "
                f"has_data={hasattr(response, 'data') and bool(response.data)}, "
                f"content_length={response.headers.get('Content-Length', 'not set')}")

    # Ensure Content-Length is set for all responses with data
    if hasattr(response, 'data') and response.data:
        if 'Content-Length' not in response.headers:
            content_length = len(response.data)
            response.headers['Content-Length'] = str(content_length)
            logger.info(f"Added Content-Length header: {content_length}")
    elif response.mimetype == 'text/html' and not (hasattr(response, 'data') and response.data):
        # If we have an empty HTML response, this might be a redirect or an error
        logger.warning(f"Empty HTML response detected for path: {request.path}")

    return response

# Add request logging middleware
@app.before_request
def log_request():
    """Log details about incoming requests."""
    request.start_time = time.time()
    logger.info(f"Request: method={request.method}, path={request.path}, "
                f"content_type={request.content_type}, "
                f"content_length={request.headers.get('Content-Length', 'not set')}")

@app.after_request
def log_response_time(response):
    """Log the time taken to process the request."""
    if hasattr(request, 'start_time'):
        duration = time.time() - request.start_time
        logger.info(f"Request processed in {duration:.4f}s")
    return response

# Ensure static files are properly served
@app.route('/static/<path:filename>')
def serve_static_file(filename):
    """
    Explicitly serve static files with proper headers.
    This is a fallback in case Flask's built-in static serving isn't working.
    """
    logger.info(f"Explicitly serving static file: {filename}")
    try:
        # Try both the app's static folder and the root static folder
        for static_dir in [app.static_folder, os.path.join(os.getcwd(), 'static')]:
            file_path = os.path.join(static_dir, filename)
            if os.path.isfile(file_path):
                with open(file_path, 'rb') as f:
                    content = f.read()

                # Determine content type based on file extension
                content_type = 'application/octet-stream'  # Default
                if filename.endswith('.html'):
                    content_type = 'text/html'
                elif filename.endswith('.css'):
                    content_type = 'text/css'
                elif filename.endswith('.js'):
                    content_type = 'application/javascript'
                elif filename.endswith('.png'):
                    content_type = 'image/png'
                elif filename.endswith('.jpg') or filename.endswith('.jpeg'):
                    content_type = 'image/jpeg'
                elif filename.endswith('.svg'):
                    content_type = 'image/svg+xml'

                response = app.response_class(
                    response=content,
                    status=200,
                    mimetype=content_type
                )
                response.headers['Content-Length'] = str(len(content))
                logger.info(f"Successfully served static file: {filename} ({len(content)} bytes)")
                return response

        # If we get here, the file wasn't found
        logger.warning(f"Static file not found: {filename}")
        return f"File not found: {filename}", 404
    except Exception as e:
        logger.error(f"Error serving static file {filename}: {e}")
        return f"Error: {str(e)}", 500

# Run app directly if script is executed
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
