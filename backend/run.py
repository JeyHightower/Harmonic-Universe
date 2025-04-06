"""
Development runner module for the Harmonic Universe backend.

This module is intended for local development only.
For production deployment, use wsgi.py instead.

This module imports and creates the Flask application,
making it easier to run the application locally.
"""

import os
import sys
import logging

# Add the backend directory to the path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import the complete create_app function from app/__init__.py
from backend.app import create_app

# Create the Flask application
app = create_app('development')

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting development server on port {port}")
    print("NOTE: For production, use wsgi.py instead")
    app.run(host='0.0.0.0', port=port, debug=True) 