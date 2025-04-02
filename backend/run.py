"""
Simple runner module for Gunicorn.

This module imports and creates the Flask application,
making it easier for Gunicorn to find and load.
"""

# Import the app factory function and create the app
from app import create_app

# Create the Flask application
app = create_app()

# This is what Gunicorn will import
application = app

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=False) 