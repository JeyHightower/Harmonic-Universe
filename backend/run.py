"""
Development runner module for the Harmonic Universe backend.

This module is intended for local development only.
For production deployment, use wsgi.py instead.

This module imports and creates the Flask application,
making it easier to run the application locally.
"""

# Import the app factory function and create the app
from app import create_app

# Create the Flask application
app = create_app()

if __name__ == "__main__":
    import os
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting development server on port {port}")
    print("NOTE: For production, use wsgi.py instead")
    app.run(host='0.0.0.0', port=port, debug=True) 