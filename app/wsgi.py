#!/usr/bin/env python
"""
Bridge module for Render.com deployment.
This file imports and re-exports the application from the root wsgi.py
"""
import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.wsgi")
logger.info("Loading bridge wsgi.py module for Render.com compatibility")

# Add the parent directory to the Python path to access the root wsgi module
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Import the application from the root wsgi
try:
    from wsgi import app, application
    logger.info("Successfully imported application from root wsgi.py")
except ImportError as e:
    logger.error(f"Failed to import from root wsgi.py: {e}")
    raise

# Re-export the application
# application = app # This is already done in the root wsgi.py

# For troubleshooting
logger.info(f"Current Python path: {sys.path}")
logger.info(f"Application object: {application}")

if __name__ == "__main__":
    logger.info("This module should not be run directly")
