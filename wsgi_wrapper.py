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

# Check both possible static directories
static_dirs = [
    os.path.join(current_dir, 'static'),  # Project root static
    os.path.join(current_dir, 'app', 'static')  # App module static
]

for static_dir in static_dirs:
    logger.info(f"Checking static directory at {static_dir}")
    if os.path.exists(static_dir):
        logger.info(f"Static directory exists at {static_dir}")
        try:
            files = os.listdir(static_dir)
            logger.info(f"Static directory contents: {files}")
        except Exception as e:
            logger.error(f"Unable to list static directory contents: {e}")
    else:
        logger.warning(f"Static directory does not exist at {static_dir}")

# Use the project root static directory for our app
static_dir = os.path.join(current_dir, 'static')

# Ensure the directory exists
if not os.path.exists(static_dir):
    try:
        os.makedirs(static_dir, exist_ok=True)
        logger.info(f"Created static directory at {static_dir}")
    except Exception as e:
        logger.error(f"Failed to create static directory: {e}")

# Patch Flask's send_from_directory function to add more logging
original_send_from_directory = flask.send_from_directory

def patched_send_from_directory(directory, path, **kwargs):
    logger.info(f"send_from_directory called with: directory={directory}, path={path}")
    try:
        full_path = os.path.join(directory, path)
        if os.path.exists(full_path):
            logger.info(f"File exists at {full_path}, size: {os.path.getsize(full_path)} bytes")

            # Read the file content directly for HTML, JS, and CSS files
            if path.endswith('.html') or path.endswith('.js') or path.endswith('.css'):
                try:
                    with open(full_path, 'r') as f:
                        content = f.read()
                    logger.info(f"Read {len(content)} bytes from {full_path}")

                    response = flask.make_response(content)
                    if path.endswith('.html'):
                        response.headers['Content-Type'] = 'text/html'
                    elif path.endswith('.js'):
                        response.headers['Content-Type'] = 'application/javascript'
                    else:
                        response.headers['Content-Type'] = 'text/css'

                    logger.info(f"Sending direct file response for {path}")
                    return response
                except Exception as e:
                    logger.error(f"Error reading file directly: {e}")
        else:
            logger.warning(f"File does not exist at {full_path}")

        # Fall back to original function
        return original_send_from_directory(directory, path, **kwargs)
    except Exception as e:
        logger.error(f"Error in patched send_from_directory: {e}")
        raise

# Apply the patch
flask.send_from_directory = patched_send_from_directory

# Try to import the Flask app with our static folder
try:
    # First patch Flask to use our static folder
    def patch_flask():
        flask_init_original = flask.Flask.__init__

        def flask_init_patched(self, import_name, static_url_path=None, static_folder=None, *args, **kwargs):
            logger.info(f"Patching Flask.__init__ to use static_folder={static_dir}")
            return flask_init_original(self, import_name, static_url_path=static_url_path, static_folder=static_dir, *args, **kwargs)

        flask.Flask.__init__ = flask_init_patched
        return flask_init_original

    # Apply the patch
    original_init = patch_flask()

    # Now import the app
    from app import create_app
    app = create_app()

    # Restore the original Flask init
    flask.Flask.__init__ = original_init

    logger.info(f"Successfully created app with static_folder: {app.static_folder}")
except Exception as e:
    logger.error(f"Error importing from app: {e}")

    # Create fallback Flask app
    app = flask.Flask(__name__, static_folder=static_dir)
    logger.info(f"Created fallback Flask app with static_folder: {app.static_folder}")

    @app.route('/')
    def home():
        logger.info("Serving fallback index.html")
        index_path = os.path.join(static_dir, 'index.html')

        # Try to read the index.html file directly
        if os.path.exists(index_path):
            try:
                with open(index_path, 'r') as f:
                    content = f.read()
                response = flask.make_response(content)
                response.headers['Content-Type'] = 'text/html'
                logger.info(f"Returning index.html with {len(content)} bytes")
                return response
            except Exception as e:
                logger.error(f"Error reading index.html: {e}")

        # Fallback to a dynamically generated page
        html = """<!DOCTYPE html>
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
</html>"""
        response = flask.make_response(html)
        response.headers['Content-Type'] = 'text/html'
        logger.info(f"Returning dynamically generated HTML with {len(html)} bytes")
        return response

    @app.route('/api/health')
    def health():
        return flask.jsonify({"status": "unhealthy", "message": "Emergency fallback app"})

    @app.route('/<path:path>')
    def static_files(path):
        logger.info(f"Serving static file: {path}")
        file_path = os.path.join(app.static_folder, path)

        # For HTML, JS, CSS files, read and return directly
        if path.endswith('.html') or path.endswith('.js') or path.endswith('.css'):
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                    response = flask.make_response(content)
                    if path.endswith('.html'):
                        response.headers['Content-Type'] = 'text/html'
                    elif path.endswith('.js'):
                        response.headers['Content-Type'] = 'application/javascript'
                    else:
                        response.headers['Content-Type'] = 'text/css'
                    logger.info(f"Returning {path} with {len(content)} bytes")
                    return response
                except Exception as e:
                    logger.error(f"Error reading {path}: {e}")

        # For other files use send_from_directory
        if os.path.exists(file_path):
            return flask.send_from_directory(app.static_folder, path)
        else:
            logger.warning(f"File not found: {path}")
            return f"File not found: {path}", 404

# Additional verification
logger.info(f"Final app static_folder: {app.static_folder}")
logger.info(f"App static_folder exists: {os.path.exists(app.static_folder)}")
if hasattr(app, 'static_folder') and os.path.exists(app.static_folder):
    try:
        files = os.listdir(app.static_folder)
        logger.info(f"App static_folder contents: {files}")

        index_path = os.path.join(app.static_folder, 'index.html')
        if os.path.exists(index_path):
            logger.info(f"index.html exists in app.static_folder")
            # Check file size
            try:
                size = os.path.getsize(index_path)
                logger.info(f"index.html size: {size} bytes")

                # Read a few bytes to verify
                with open(index_path, 'r') as f:
                    first_bytes = f.read(100)
                logger.info(f"First 100 bytes of index.html: {first_bytes[:100]}")
            except Exception as e:
                logger.error(f"Error checking index.html: {e}")
        else:
            logger.warning(f"index.html does not exist in app.static_folder")
    except Exception as e:
        logger.error(f"Error checking app.static_folder: {e}")
else:
    logger.warning(f"App static_folder doesn't exist: {app.static_folder}")

# Also patch the app.send_static_file method for more reliability
if hasattr(app, 'send_static_file'):
    original_send_static_file = app.send_static_file

    def patched_send_static_file(filename):
        logger.info(f"send_static_file called with: {filename}")
        file_path = os.path.join(app.static_folder, filename)
        if os.path.exists(file_path):
            # For HTML, JS, CSS files, read and serve directly
            if filename.endswith('.html') or filename.endswith('.js') or filename.endswith('.css'):
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                    response = flask.make_response(content)
                    if filename.endswith('.html'):
                        response.headers['Content-Type'] = 'text/html'
                    elif filename.endswith('.js'):
                        response.headers['Content-Type'] = 'application/javascript'
                    else:
                        response.headers['Content-Type'] = 'text/css'
                    logger.info(f"Returning {filename} from send_static_file with {len(content)} bytes")
                    return response
                except Exception as e:
                    logger.error(f"Error in patched send_static_file: {e}")

        # Fall back to original method
        return original_send_static_file(filename)

    app.send_static_file = patched_send_static_file

logger.info("WSGI app initialization complete")
