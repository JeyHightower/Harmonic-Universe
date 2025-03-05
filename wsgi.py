"""
WSGI entry point for Gunicorn
This file imports the create_app function from app.py
"""
import os
import sys

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the create_app function from app.py
from app import create_app

# Create the application instance
application = create_app()

# This allows Gunicorn to use 'wsgi:application'
if __name__ == "__main__":
    # Run the application if executed directly
    application.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
