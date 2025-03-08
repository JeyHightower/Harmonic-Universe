#!/usr/bin/env python
"""
WSGI application for Harmonic Universe deployment on Render.com.
"""
import os
import sys
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.wsgi")
logger.info("Starting app.wsgi module")

# Add the current directory to the Python path
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to sys.path")

# Ensure static directory exists and contains index.html
def ensure_static_files():
    """Ensure static directories exist and contain index.html."""
    # Check static directories
    static_dirs = [
        os.environ.get('STATIC_DIR', '/opt/render/project/src/static'),
        os.path.join(current_dir, 'static'),
        os.path.join(current_dir, 'app', 'static')
    ]

    for static_dir in static_dirs:
        # Ensure directory exists
        if not os.path.exists(static_dir):
            try:
                os.makedirs(static_dir, exist_ok=True)
                logger.info(f"Created static directory: {static_dir}")
            except Exception as e:
                logger.error(f"Failed to create static directory {static_dir}: {e}")
                continue

        # Check for index.html
        index_html = os.path.join(static_dir, 'index.html')
        if not os.path.exists(index_html):
            try:
                logger.info(f"Creating index.html in {static_dir}")
                with open(index_html, 'w') as f:
                    f.write("""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 30px;
            max-width: 600px;
            text-align: center;
        }
        h1 { color: #3f51b5; }
        p { color: #555; }
        .btn {
            display: inline-block;
            background-color: #3f51b5;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Harmonic Universe</h1>
        <p>Created by wsgi.py static file handler</p>
        <a href="/api/health" class="btn">API Health Check</a>
    </div>
</body>
</html>""")
                os.chmod(index_html, 0o644)
                logger.info(f"Successfully created index.html in {static_dir}")
            except Exception as e:
                logger.error(f"Failed to create index.html in {static_dir}: {e}")
        else:
            logger.info(f"Found existing index.html in {static_dir}")

# Run the static file check at startup
ensure_static_files()

try:
    # Import the Flask app using the create_app factory
    from app import create_app
    app = create_app()
    logger.info("Successfully created Flask application using create_app()")

    # Add middleware to ensure Content-Length header is set
    @app.after_request
    def add_content_length(response):
        """Ensure Content-Length header is set for all responses."""
        if 'Content-Length' not in response.headers and hasattr(response, 'data'):
            response.headers['Content-Length'] = str(len(response.data))
        return response

    # Add a test route
    @app.route('/render-test')
    def render_test():
        """Test route to verify WSGI setup."""
        return {
            'status': 'ok',
            'message': 'Render WSGI test successful',
            'static_folder': app.static_folder,
            'routes': [str(rule) for rule in app.url_map.iter_rules()]
        }

    # Add an explicit root route if not already present
    if '/' not in [rule.rule for rule in app.url_map.iter_rules()]:
        logger.info("Adding explicit root route handler")
        from flask import send_from_directory

        @app.route('/')
        def serve_root():
            """Serve the index.html file from static folder."""
            logger.info(f"Serving root from static folder: {app.static_folder}")
            try:
                # Verify index.html exists before trying to serve it
                index_path = os.path.join(app.static_folder, 'index.html')
                if not os.path.exists(index_path):
                    logger.error(f"index.html not found at {index_path}")
                    # Create index.html as a last resort
                    with open(index_path, 'w') as f:
                        f.write("""<!DOCTYPE html>
<html><head><title>Harmonic Universe</title></head>
<body><h1>Harmonic Universe</h1><p>Emergency page created by root handler</p></body>
</html>""")
                    logger.info(f"Created emergency index.html at {index_path}")

                return send_from_directory(app.static_folder, 'index.html')
            except Exception as e:
                logger.error(f"Error serving index.html: {e}")
                return f"""
                <html><body>
                <h1>Harmonic Universe</h1>
                <p>Error serving index.html: {str(e)}</p>
                <p>Static folder: {app.static_folder}</p>
                <p><a href="/api/health">API Health Check</a></p>
                </body></html>
                """

    @app.route('/home')
    def home():
        """Alternative home route."""
        return serve_root()

except Exception as e:
    logger.error(f"Failed to create Flask app: {e}", exc_info=True)

    # If we can't import the app, create a minimal one for health checks
    from flask import Flask, jsonify, send_from_directory
    app = Flask(__name__)

    @app.route('/')
    def serve_root():
        """Serve a minimal home page."""
        static_folder = os.environ.get('STATIC_DIR', os.path.join(os.getcwd(), 'static'))
        try:
            return send_from_directory(static_folder, 'index.html')
        except Exception as e:
            return f"""
            <html><body>
            <h1>Harmonic Universe</h1>
            <p>Error serving index.html: {str(e)}</p>
            <p>Static folder: {static_folder}</p>
            <p><a href="/api/health">API Health Check</a></p>
            </body></html>
            """

    @app.route('/health')
    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'error',
            'message': 'Application failed to load properly',
            'error': str(e)
        })

# Create the 'application' alias that Gunicorn expects
application = app
logger.info("Created 'application' alias for Gunicorn compatibility")

# Print routes functionality for debugging
def print_routes():
    """Print all routes registered in the application."""
    print("\n=== Application Routes ===")
    for rule in sorted(app.url_map.iter_rules(), key=lambda x: str(x)):
        print(f"Route: {rule.rule} => {rule.endpoint}")
    print("=========================\n")
    return 0

# For direct execution (development only)
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == 'print_routes':
        sys.exit(print_routes())

    port = int(os.environ.get('PORT', 10000))
    logger.info(f"Starting Flask app on port {port}")
    app.run(host='0.0.0.0', port=port)
