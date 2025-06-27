"""
Simplified app.py that redirects to the main app in wsgi.py.
This file exists only for backward compatibility with existing code that imports from here.
"""

# Import directly from wsgi.py for consistency
from wsgi import app, application, create_app

# If this file is run directly, delegate to wsgi.py
if __name__ == "__main__":
    import wsgi