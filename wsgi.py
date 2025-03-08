#!/usr/bin/env python
"""
WSGI entry point for Gunicorn.
This file imports and exposes the Flask application using the standard pattern.
"""
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import the create_app function
from app import create_app

# Create the Flask application
app = create_app()

# Add middleware to ensure proper content-length
@app.after_request
def add_content_length(response):
    """Add Content-Length header to HTML responses if missing."""
    if response.mimetype == 'text/html' and hasattr(response, 'data') and response.data:
        if 'Content-Length' not in response.headers:
            response.headers['Content-Length'] = str(len(response.data))
    return response

# Run app directly if script is executed
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
