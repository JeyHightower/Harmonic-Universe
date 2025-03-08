#!/usr/bin/env python
"""
Standalone WSGI application for Render.com.
This file creates a basic Flask application that can run independently.
"""
import os
import sys
import logging
from flask import Flask, jsonify

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.wsgi")
logger.info("Starting standalone app.wsgi module")

# Create a basic Flask application
application = Flask(__name__)

# Add the current directory to the Python path
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to sys.path")

# Print the Python path for debugging
logger.info(f"Python path: {sys.path}")
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Directory contents: {os.listdir('.')}")
if os.path.exists('app'):
    logger.info(f"App directory contents: {os.listdir('app')}")

# Basic routes for health check
@application.route('/')
def home():
    return jsonify({
        "status": "ok",
        "message": "Harmonic Universe application is running in standalone mode"
    })

@application.route('/api/health')
def health():
    return jsonify({
        "status": "ok",
        "message": "Health check passed"
    })

# Try to import the real application if possible
try:
    # First try importing directly from app module if it has create_app
    logger.info("Attempting to import create_app from app module")
    try:
        from app import create_app
        logger.info("Found create_app in app module, initializing app")
        real_app = create_app()
        application = real_app
        logger.info("Successfully initialized app from create_app")
    except (ImportError, AttributeError) as e:
        logger.warning(f"Could not import create_app from app: {e}")

        # Try importing from the root wsgi
        try:
            logger.info("Attempting to import from root wsgi.py")
            # First try to fix the common load_dotenv error
            try:
                # Check if config.py exists and needs patching
                if os.path.exists('config.py'):
                    with open('config.py', 'r') as f:
                        config_content = f.read()

                    # Check if load_dotenv is used but not imported
                    if 'load_dotenv()' in config_content and 'from dotenv import load_dotenv' not in config_content:
                        logger.info("Patching config.py to import load_dotenv")
                        with open('config.py', 'w') as f:
                            patched_content = "from dotenv import load_dotenv\n" + config_content
                            f.write(patched_content)
            except Exception as patch_err:
                logger.warning(f"Failed to patch config.py: {patch_err}")

            # Now try importing from wsgi
            from wsgi import application as real_app
            application = real_app
            logger.info("Successfully imported real application from wsgi.py")
        except Exception as wsgi_err:
            logger.warning(f"Could not import from wsgi.py: {wsgi_err}")

            # Try importing from app.py
            try:
                logger.info("Attempting to import from app.py")
                from app import app as real_app
                application = real_app
                logger.info("Successfully imported from app.py")
            except Exception as app_err:
                logger.warning(f"Could not import from app.py: {app_err}")
                logger.warning("Using standalone Flask application as fallback")
except Exception as e:
    logger.exception(f"Error during application import: {e}")
    logger.warning("Using standalone Flask application as fallback")

# Make the application available as 'app' as well (some WSGI servers use this name)
app = application

# Add a /debug route for troubleshooting
@app.route('/debug')
def debug_info():
    import platform
    import datetime

    # Only add this route if it doesn't already exist
    if app.name == 'app.wsgi' or '/debug' not in [rule.rule for rule in app.url_map.iter_rules()]:
        return jsonify({
            "status": "ok",
            "app_name": app.name,
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "paths": sys.path,
            "timestamp": datetime.datetime.now().isoformat(),
            "env_vars": {k: v for k, v in os.environ.items() if not k.startswith("SECRET") and not "KEY" in k.upper()},
            "routes": [str(rule) for rule in app.url_map.iter_rules()],
            "mode": "standalone" if app.name == 'app.wsgi' else "integrated"
        })
    return jsonify({"error": "Not available in integrated mode"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Running application in development mode on port {port}")
    application.run(host="0.0.0.0", port=port, debug=True)
