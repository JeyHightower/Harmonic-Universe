"""
Root-level app.py to fix import issues on Render.com
This file provides a clean entry point for gunicorn
"""
import os
import sys

# Add the current directory to Python path to ensure imports work correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def create_app():
    """
    Factory function that creates and returns the Flask application.
    This avoids circular imports by importing the actual app inside the function.
    """
    try:
        # Import your actual application from the backend
        from backend.app import create_app as backend_create_app
        # Import the appropriate config from backend
        from backend.app.core.config import config

        # Create the application using the backend factory function
        app = backend_create_app(config['production'])

        # No need to apply middleware here as it's already applied in backend create_app
        return app
    except Exception as e:
        import traceback
        print(f"Error creating app: {e}")
        print(traceback.format_exc())
        raise

# Optional: Allow direct execution of this file
if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
