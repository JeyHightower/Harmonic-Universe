# WSGI entry point for Harmonic Universe backend

"""
This file serves as a WSGI entry point for the Flask application.
It attempts to load the Flask app using various methods and provides fallbacks.
"""

import os
import sys
import shutil

# Add both the project root and backend directories to the Python path
project_root = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
backend_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, project_root)
sys.path.insert(0, backend_dir)

# Print debug information
print("==== WSGI Debug Information ====")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"File location: {__file__}")
print(f"Project root: {project_root}")
print(f"Backend directory: {backend_dir}")
print(f"Python path: {sys.path}")
print(f"Environment: {os.environ.get('FLASK_ENV', 'not set')}")
print(f"Modules in backend/: {[f for f in os.listdir(backend_dir) if f.endswith('.py')]}")
print("================================")

# Create a symlink or copy of backend/app.py to app.py in the root directory if needed
app_py_path = os.path.join(project_root, 'app.py')
backend_app_py_path = os.path.join(backend_dir, 'app.py')

if not os.path.exists(app_py_path) and os.path.exists(backend_app_py_path):
    print(f"Creating app.py in root directory {app_py_path}")
    try:
        with open(app_py_path, 'w') as f:
            f.write('# Re-export everything from backend.app\nfrom backend.app import *\n')
        print("Successfully created app.py in root directory")
    except Exception as e:
        print(f"Error creating app.py in root directory: {e}")

# Try to copy the app.py if it exists
if os.path.exists(backend_app_py_path) and not os.path.exists(app_py_path):
    try:
        shutil.copy2(backend_app_py_path, app_py_path)
        print(f"Copied backend/app.py to {app_py_path}")
    except Exception as e:
        print(f"Error copying app.py: {e}")

# Import your Flask app
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
            print("Attempting to import app directly from app module...")
            from app import app
            print("Successfully imported app from app module")
        except ImportError as e:
            print(f"Failed to import app from app module: {e}")
            try:
                print("Attempting to import create_app from app module...")
                from app import create_app
                print("Successfully imported create_app from app module, creating app instance...")
                app = create_app()
                print("Successfully created app instance")
            except ImportError as e:
                print(f"Failed to import create_app from app module: {e}")
                
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
from flask import send_from_directory, send_file

# Path to the React build directory
react_build_path = os.path.join(project_root, 'frontend', 'dist')
static_path = os.path.join(backend_dir, 'static')

print(f"React build path: {react_build_path}")
print(f"Static path: {static_path}")
print(f"React build exists: {os.path.exists(react_build_path)}")
print(f"Static exists: {os.path.exists(static_path)}")

# Serve static assets from the /assets directory
@app.route('/assets/<path:path>')
def serve_assets(path):
    assets_dir = os.path.join(react_build_path, 'assets')
    if os.path.exists(assets_dir):
        print(f"Serving asset: {path}")
        return send_from_directory(assets_dir, path)
    
    assets_dir = os.path.join(static_path, 'assets')
    if os.path.exists(assets_dir):
        print(f"Serving asset from static: {path}")
        return send_from_directory(assets_dir, path)
    
    print(f"Asset not found: {path}")
    return "Asset not found", 404

# Override any existing routes for the root URL
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    # Skip API routes
    if path.startswith('api/'):
        print(f"Skipping API route: {path}")
        return app.response_class(
            response="Not found",
            status=404
        )
    
    # First try the path in the React build directory
    file_path = os.path.join(react_build_path, path)
    if os.path.isfile(file_path):
        print(f"Serving file from React build: {path}")
        return send_file(file_path)
    
    # Then try the path in the static directory
    file_path = os.path.join(static_path, path)
    if os.path.isfile(file_path):
        print(f"Serving file from static: {path}")
        return send_file(file_path)
    
    # If it's not a file, serve index.html (for SPA routing)
    index_path = os.path.join(react_build_path, 'index.html')
    if os.path.exists(index_path):
        print(f"Serving index.html for path: {path}")
        return send_file(index_path)
    
    index_path = os.path.join(static_path, 'index.html')
    if os.path.exists(index_path):
        print(f"Serving index.html from static for path: {path}")
        return send_file(index_path)
    
    print(f"React app not found for path: {path}")
    return "React app not found", 404

# For gunicorn
application = app

# Print app information
print(f"WSGI app: {app}")
print(f"WSGI app type: {type(app)}")
try:
    print(f"WSGI app routes: {app.url_map}")
except Exception as e:
    print(f"Could not print app routes: {e}") 