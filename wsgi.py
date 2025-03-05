"""
WSGI entry point for Gunicorn
This file imports the create_app function from app.py
"""
import os
import sys

# Ensure path includes current directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and create the app
from app import create_app
application = create_app()

# For direct execution
if __name__ == "__main__":
    application.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
