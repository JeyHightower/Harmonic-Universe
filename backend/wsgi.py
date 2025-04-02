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

# Configure Flask to serve the React app
from flask import send_from_directory

# Path to the React build directory
react_build_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')
static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'static')

print(f"React build path: {react_build_path}")
print(f"Static path: {static_path}")
print(f"React build exists: {os.path.exists(react_build_path)}")
print(f"Static exists: {os.path.exists(static_path)}")

# Override any existing routes for the root URL
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    # First try the path in the React build directory
    if path and os.path.exists(os.path.join(react_build_path, path)):
        print(f"Serving file from React build: {path}")
        return send_from_directory(react_build_path, path)
    # Then try the static directory
    elif path and os.path.exists(os.path.join(static_path, path)):
        print(f"Serving file from static: {path}")
        return send_from_directory(static_path, path)
    # Finally, serve index.html from React build or static
    else:
        if os.path.exists(os.path.join(react_build_path, 'index.html')):
            print(f"Serving index.html from React build")
            return send_from_directory(react_build_path, 'index.html')
        elif os.path.exists(os.path.join(static_path, 'index.html')):
            print(f"Serving index.html from static")
            return send_from_directory(static_path, 'index.html')
        else:
            print(f"No index.html found, serving minimal response")
            return "Harmonic Universe - No frontend files found"

# For gunicorn
application = app

# Print app information
print(f"WSGI app: {app}")
print(f"WSGI app type: {type(app)}")
try:
    print(f"WSGI app routes: {app.url_map}")
except Exception as e:
    print(f"Could not print app routes: {e}") 