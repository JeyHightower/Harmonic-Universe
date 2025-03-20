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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            max-width: 800px;
            padding: 2rem;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            text-align: center;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        p {
            font-size: 1.2rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }
        .button-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;
        }
        .button {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            padding: 0.8rem 1.8rem;
            border-radius: 30px;
            font-weight: bold;
            transition: all 0.3s ease;
            margin: 0.5rem;
        }
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
            background: rgba(255, 255, 255, 0.3);
        }
        .button-primary {
            background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
        }
        .button-secondary {
            background: linear-gradient(to right, #f093fb 0%, #f5576c 100%);
        }
        .button-tertiary {
            background: linear-gradient(to right, #43e97b 0%, #38f9d7 100%);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Explore the fascinating connection between music and physics.</p>
        <div class="button-container">
            <a href="/login" class="button button-primary">Login</a>
            <a href="/signup" class="button button-secondary">Sign Up</a>
            <a href="/demo" class="button button-tertiary">Try Demo</a>
        </div>
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
            content_length = len(response.data) if response.data else 0
            response.headers['Content-Length'] = str(content_length)
            logger.debug(f"Added Content-Length header: {content_length}")
        return response

    # Add a test route for Render.com verification
    @app.route('/render-test')
    def render_test():
        """Test route to verify WSGI setup."""
        return {
            'status': 'ok',
            'message': 'Render WSGI test successful',
            'static_folder': app.static_folder,
            'routes': [str(rule) for rule in app.url_map.iter_rules()]
        }

    # Note: We're NOT defining duplicate routes here.
    # All other routes (/login, /signup, /demo, etc.) should be defined
    # in the app/__init__.py file using the create_app() function.

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
            # Return a proper response with content
            with open(os.path.join(static_folder, 'index.html'), 'r') as f:
                content = f.read()

            response = app.response_class(
                response=content,
                status=200,
                mimetype='text/html'
            )
            response.headers['Content-Length'] = str(len(content))
            return response
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
