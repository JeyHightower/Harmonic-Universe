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
    print("Successfully imported app modules")
except ImportError as e:
    print(f"Import error: {e}")
    print(f"Python path: {sys.path}")
    # Try alternative import paths
    try:
        from app import create_app
        print("Successfully imported from app")
    except ImportError as e2:
        print(f"Alternative import also failed: {e2}")
        raise

# Create the Flask application
application = create_app()
app = application  # For compatibility with different WSGI servers

if __name__ == "__main__":
    # For direct execution
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
