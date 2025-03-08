#!/usr/bin/env python
"""
WSGI entry point for Gunicorn.
This file imports and exposes the Flask application using the standard pattern.
"""
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("wsgi")

# Import the Flask application factory
logger.info("Importing app.create_app")
from app import create_app

# Create the Flask application
logger.info("Creating Flask application")
app = create_app()

# Add middleware to ensure Content-Length is set for HTML responses
@app.after_request
def ensure_content_length(response):
    """Ensure Content-Length header is set for all responses."""
    if response.mimetype == 'text/html' and hasattr(response, 'data') and response.data:
        if 'Content-Length' not in response.headers:
            response.headers['Content-Length'] = str(len(response.data))
            logger.debug(f"Added Content-Length header: {len(response.data)} bytes")
    return response

logger.info(f"Flask application '{app.name}' initialized with static folder: {app.static_folder}")

# Allow running the app directly
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Running application directly on port {port}")
    app.run(host="0.0.0.0", port=port)
