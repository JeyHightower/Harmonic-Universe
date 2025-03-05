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
        from flask import send_from_directory

        # Create the application using the backend factory function
        app = backend_create_app(config['production'])

        # We don't need to add serve_assets route here since it's already defined in backend/app/__init__.py

        # Make sure all routes are handled, even if not explicitly defined
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def root_catch_all(path):
            if path and os.path.exists(os.path.join(app.static_folder, path)):
                return send_from_directory(app.static_folder, path)
            return send_from_directory(app.static_folder, 'index.html')

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
