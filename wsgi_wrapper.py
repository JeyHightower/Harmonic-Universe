#!/usr/bin/env python
# wsgi_wrapper.py - A wrapper that ensures dependencies are available

import os
import sys
import logging
import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wsgi_wrapper")

logger.info("Starting wsgi_wrapper.py")
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Python path: {sys.path}")

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Verify dependencies
try:
    import flask
    logger.info(f"Found Flask: {flask.__version__}")
    import psycopg2
    logger.info(f"Found psycopg2: {psycopg2.__version__}")
except ImportError as e:
    logger.error(f"Missing dependency: {e}")
    raise ImportError(f"Critical dependency missing: {e}")

# Get absolute path to static directory
static_dir = os.path.join(current_dir, 'static')
logger.info(f"Checking static directory at {static_dir}")

# Ensure static directory exists
if os.path.exists(static_dir):
    logger.info(f"Static directory exists at {static_dir}")
    try:
        files = os.listdir(static_dir)
        logger.info(f"Static directory contents: {files}")
    except Exception as e:
        logger.error(f"Unable to list static directory contents: {e}")
else:
    logger.warning(f"Static directory does not exist at {static_dir}")
    try:
        # Create the static directory
        os.makedirs(static_dir, exist_ok=True)
        logger.info(f"Created static directory at {static_dir}")
    except Exception as e:
        logger.error(f"Failed to create static directory: {e}")

# Ensure index.html exists
index_path = os.path.join(static_dir, 'index.html')
if not os.path.exists(index_path):
    logger.warning(f"index.html not found at {index_path}, creating it")
    try:
        with open(index_path, 'w') as f:
            f.write("""<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; }
        .container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Application is running! This is a fallback page created by wsgi_wrapper.py.</p>
        <div id="api-status">Checking API status...</div>
        <div id="debug-info">
            <p>Generated at: """ + datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """</p>
            <p>Path: """ + index_path + """</p>
        </div>
    </div>
    <script>
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:' + (data.status === 'healthy' ? 'green' : 'red') + '">' + data.status + '</span>';
            })
            .catch(error => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:red">Connection Failed</span>';
            });
    </script>
</body>
</html>""")
        logger.info(f"Created index.html at {index_path}")
    except Exception as e:
        logger.error(f"Failed to create index.html: {e}")

# Try to import the Flask app
try:
    # Import using the correct static folder path
    import sys
    from app import create_app

    # Override Flask's static folder configuration
    import flask
    original_flask_init = flask.Flask.__init__

    def custom_flask_init(self, *args, **kwargs):
        # Force static_folder to be absolute path
        kwargs['static_folder'] = static_dir
        return original_flask_init(self, *args, **kwargs)

    # Temporarily patch Flask's __init__ to force our static folder
    flask.Flask.__init__ = custom_flask_init

    # Create the app
    app = create_app()

    # Restore original Flask init
    flask.Flask.__init__ = original_flask_init

    logger.info(f"Successfully created app with static_folder: {app.static_folder}")

    # Check that static folder exists and contains index.html
    if app.static_folder and os.path.exists(app.static_folder):
        logger.info(f"App static_folder exists: {app.static_folder}")

        if os.path.exists(os.path.join(app.static_folder, 'index.html')):
            logger.info(f"index.html exists in app.static_folder")
        else:
            logger.warning(f"index.html does not exist in app.static_folder")
    else:
        logger.warning(f"App static_folder doesn't exist: {app.static_folder}")
except Exception as e:
    logger.error(f"Error importing from app: {e}")

    # Create fallback Flask app
    from flask import Flask, send_from_directory, jsonify

    app = Flask(__name__, static_folder=static_dir)
    logger.info(f"Created fallback Flask app with static_folder: {app.static_folder}")

    @app.route('/')
    def home():
        logger.info("Serving fallback index.html")
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/api/health')
    def health():
        return jsonify({"status": "unhealthy", "message": "Emergency fallback app"})

    @app.route('/<path:path>')
    def static_files(path):
        logger.info(f"Serving static file: {path}")
        return send_from_directory(app.static_folder, path)

    logger.info("Created fallback app with correct static folder")

# Log app configuration
logger.info(f"App static folder: {app.static_folder}")
if hasattr(app, 'config'):
    logger.info(f"App config: {app.config}")

# This is the WSGI entry point that gunicorn will use
logger.info("WSGI app initialization complete")
