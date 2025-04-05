"""
Simplified app.py that redirects to the main app in app/__init__.py.

This file exists only for backward compatibility with existing code that imports from here.
For development, use run.py directly.
For production, use wsgi.py with a WSGI server like Gunicorn.
"""

import os
import sys
import logging

# Add the current directory to Python's path to ensure proper imports
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Set up logging
logger = logging.getLogger(__name__)
logger.warning("app.py is deprecated; use run.py (development) or wsgi.py (production) instead")

# Import directly from the backend/app package
from backend.app import create_app

# Create the application
app = create_app()

# Only run this directly in exceptional cases (not recommended)
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    logger.warning(f"Running directly from app.py is not recommended")
    app.run(host='0.0.0.0', port=port, debug=True) 