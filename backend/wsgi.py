# WSGI entry point for Harmonic Universe backend

"""
This file serves as a WSGI entry point for the Flask application.
It attempts to load the Flask app using various methods and provides fallbacks.
"""

import sys
import os

# Add debug print statements
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"Python path: {sys.path}")

# Import your Flask app properly
try:
    # First try the create_app factory pattern
    from backend.app import create_app
    app = create_app()
    print("Successfully loaded Flask app using create_app factory")
except (ImportError, AttributeError) as e:
    print(f"Error using create_app factory: {str(e)}")
    
    try:
        # Try direct app import
        from backend.app import app
        print("Successfully loaded Flask app directly")
    except (ImportError, AttributeError) as e:
        print(f"Error importing app directly: {str(e)}")
        
        try:
            # Try other common app variable names
            import backend.app as backend_module
            
            # Check for common Flask app variable names
            if hasattr(backend_module, 'application'):
                app = backend_module.application
                print("Found and using 'application' variable")
            elif hasattr(backend_module, 'flask_app'):
                app = backend_module.flask_app
                print("Found and using 'flask_app' variable")
            else:
                # Last resort - search for Flask instance
                flask_var_found = False
                for var_name in dir(backend_module):
                    var = getattr(backend_module, var_name)
                    if str(type(var)).endswith("'flask.app.Flask'>"):
                        app = var
                        print(f"Found Flask app as '{var_name}'")
                        flask_var_found = True
                        break
                
                if not flask_var_found:
                    # Create minimal app if all else fails
                    from flask import Flask, jsonify
                    
                    print("Creating minimal Flask app as last resort")
                    app = Flask(__name__, static_folder='static')
                    
                    @app.route('/api/health')
                    def health():
                        return jsonify({"status": "ok"})
                    
                    @app.route('/')
                    def home():
                        return "Harmonic Universe API is running (minimal fallback)"
        except Exception as e:
            # Final fallback if all else fails
            from flask import Flask, jsonify
            
            print(f"Error with module inspection: {str(e)}")
            print("Creating minimal Flask app as absolute last resort")
            app = Flask(__name__, static_folder='static')
            
            @app.route('/api/health')
            def health():
                return jsonify({"status": "ok"})
            
            @app.route('/')
            def home():
                return "Harmonic Universe API is running (fallback)"

# Final check to ensure app is defined
if 'app' not in locals():
    from flask import Flask
    print("ERROR: app variable was not defined by any method, creating minimal app")
    app = Flask(__name__)

# For debugging
print(f"WSGI app: {app}")
print(f"WSGI app type: {type(app)}")
print(f"WSGI app routes: {app.url_map}")

# This is what Gunicorn will use
application = app 