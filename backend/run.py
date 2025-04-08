"""
Development runner module for the Harmonic Universe backend.

This module is intended for local development only.
For production deployment, use wsgi.py directly.

This is a simple wrapper that runs the app with development settings.
"""

import os

# Set development environment variables
os.environ.setdefault('FLASK_ENV', 'development')
os.environ.setdefault('FLASK_DEBUG', 'True')
os.environ.setdefault('LOG_LEVEL', 'DEBUG')

# Import and run from wsgi.py
if __name__ == "__main__":
    print("Starting development server...")
    import wsgi 