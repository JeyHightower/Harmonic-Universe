"""
WSGI entry point for gunicorn
"""
import sys
import os

# Add the project root and backend directories to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now import the app module
try:
    from backend.app import create_app
    from backend.app.core.middleware import setup_middleware
    from backend.app.core.config import config
    print("Successfully imported app modules")
except ImportError as e:
    print(f"Import error: {e}")
    print(f"Python path: {sys.path}")
    # Try alternative import paths
    try:
        from backend.app import create_app
        from backend.app.core.middleware import setup_middleware
        from backend.app.core.config import config
        print("Successfully imported from backend.app")
    except ImportError as e2:
        print(f"Alternative import also failed: {e2}")
        raise

# Create the Flask application
app = create_app(config['production'])
# Apply middleware
app = setup_middleware(app)

if __name__ == '__main__':
    app.run()
