# WSGI entry point for Harmonic Universe backend

"""
This file serves as a WSGI entry point for the Flask application.
It attempts to load the Flask app using various methods and provides fallbacks.
"""

import os
import sys

# Add the project root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Print debug information
print("==== WSGI Debug Information ====")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"File location: {__file__}")
print(f"Python path: {sys.path}")
print(f"Environment: {os.environ.get('FLASK_ENV', 'not set')}")
print(f"Modules in backend/: {[f for f in os.listdir('backend') if f.endswith('.py')]}")
print("================================")

# Import your Flask app
# Try different import patterns based on your project structure
try:
    print("Attempting to import from backend.app...")
    from backend.app import app
    print("Successfully imported app from backend.app")
except ImportError as e:
    print(f"Failed to import app from backend.app: {e}")
    try:
        print("Attempting to import create_app from backend.app...")
        from backend.app import create_app
        print("Successfully imported create_app, creating app instance...")
        app = create_app()
        print("Successfully created app instance")
    except ImportError as e:
        print(f"Failed to import create_app from backend.app: {e}")
        try:
            print("Attempting to import app directly from backend...")
            from backend import app
            print("Successfully imported app from backend")
        except ImportError as e:
            print(f"Failed to import app from backend: {e}")
            try:
                print("Attempting to import create_app from backend...")
                from backend import create_app
                print("Successfully imported create_app from backend, creating app instance...")
                app = create_app()
                print("Successfully created app instance")
            except ImportError as e:
                print(f"Failed to import create_app from backend: {e}")
                
                # Final fallback - create a minimal app
                print("All import attempts failed, creating minimal Flask app")
                from flask import Flask, jsonify
                app = Flask(__name__, static_folder='static')
                
                @app.route('/api/health')
                def health():
                    return jsonify({"status": "ok"})
                
                @app.route('/')
                def index():
                    return "Harmonic Universe API - Minimal Fallback App"

# For gunicorn
application = app

# Print app information
print(f"WSGI app: {app}")
print(f"WSGI app type: {type(app)}")
try:
    print(f"WSGI app routes: {app.url_map}")
except Exception as e:
    print(f"Could not print app routes: {e}") 