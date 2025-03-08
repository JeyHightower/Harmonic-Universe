from flask import Flask, send_from_directory, jsonify, current_app
from flask_migrate import Migrate
from flask_cors import CORS
import os
import logging
import sys

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Initializing app package")

# Initialize extensions
migrate = Migrate()

def create_app():
    # Determine static folder based on environment
    if os.environ.get('RENDER') == 'true':
        static_folder = '/opt/render/project/src/static'
    else:
        static_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static'))

    # Ensure static folder exists
    try:
        os.makedirs(static_folder, exist_ok=True)
        logger.info(f"Using static folder: {static_folder}")
    except Exception as e:
        logger.error(f"Failed to create static folder: {e}")
        # Don't raise an exception, try to continue with a fallback
        static_folder = os.path.abspath(os.path.join(os.getcwd(), 'static'))
        os.makedirs(static_folder, exist_ok=True)
        logger.info(f"Using fallback static folder: {static_folder}")

    # Check if index.html exists in the static folder
    index_html_path = os.path.join(static_folder, 'index.html')
    if os.path.exists(index_html_path):
        logger.info(f"Found index.html at {index_html_path}")
    else:
        logger.warning(f"index.html not found at {index_html_path}")
        # We'll create it in the route handler if needed

    # List static folder contents
    try:
        static_contents = os.listdir(static_folder)
        logger.info(f"Static folder contents: {static_contents}")
    except Exception as e:
        logger.error(f"Could not list static folder contents: {e}")

    app = Flask(__name__, static_folder=static_folder, static_url_path='')

    # Basic configuration
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///app.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SEND_FILE_MAX_AGE_DEFAULT=0
    )

    # Enable CORS
    CORS(app)

    # Register health check route
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Harmonic Universe API is running',
            'version': '1.0',
            'environment': os.environ.get('APP_ENV', 'development'),
            'static_folder': app.static_folder,
            'python_version': sys.version
        })

    # Special route to handle all static files including the Ant Design icons
    @app.route('/assets/<path:filename>')
    def serve_assets(filename):
        try:
            assets_path = os.path.join(app.static_folder, 'assets')
            if not os.path.exists(assets_path):
                os.makedirs(assets_path, exist_ok=True)
                logger.info(f"Created assets directory: {assets_path}")

            if os.path.exists(os.path.join(assets_path, filename)):
                return send_from_directory(assets_path, filename)
            else:
                logger.warning(f"Asset file not found: {filename}")
                return '', 404
        except Exception as e:
            logger.error(f"Error serving asset {filename}: {e}")
            return str(e), 500

    # Debug route to view application information
    @app.route('/debug')
    def debug_info():
        if os.environ.get('APP_ENV') == 'production' and not os.environ.get('RENDER'):
            return jsonify({"error": "Debug only available in development or on Render"}), 403

        try:
            import platform

            debug_data = {
                "app_name": app.name,
                "static_folder": app.static_folder,
                "static_folder_exists": os.path.exists(app.static_folder),
                "static_contents": os.listdir(app.static_folder) if os.path.exists(app.static_folder) else [],
                "index_html_exists": os.path.exists(os.path.join(app.static_folder, 'index.html')),
                "routes": [str(rule) for rule in app.url_map.iter_rules()],
                "python_version": platform.python_version(),
                "platform": platform.platform(),
                "environment": os.environ.get('APP_ENV', 'development'),
                "render": os.environ.get('RENDER', 'false')
            }

            return jsonify(debug_data)
        except Exception as e:
            logger.error(f"Error in debug route: {e}")
            return jsonify({"error": str(e)}), 500

    # Route to serve React App
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_static(path):
        if path and path.startswith('api/'):
            # Let Flask handle API routes
            return app.handle_request()

        try:
            # Try to serve the requested path
            if path and os.path.exists(os.path.join(app.static_folder, path)):
                logger.info(f"Serving static file: {path}")
                return send_from_directory(app.static_folder, path)

            # Default to index.html (SPA approach)
            logger.info(f"Serving index.html for path: {path}")

            # Check if index.html exists
            index_path = os.path.join(app.static_folder, 'index.html')
            if not os.path.exists(index_path):
                # Create a minimal index.html if it doesn't exist
                logger.warning(f"index.html not found, creating default")
                with open(index_path, 'w') as f:
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
        <p>The application is running successfully.</p>
        <a href="/api/health" class="btn">API Health Check</a>
    </div>
</body>
</html>""")

            return send_from_directory(app.static_folder, 'index.html')

        except Exception as e:
            logger.error(f"Error serving static content for '{path}': {e}")
            return f"""
            <html><body>
            <h1>Harmonic Universe</h1>
            <p>Error serving content: {str(e)}</p>
            <p>Path: {path}</p>
            <p>Static folder: {app.static_folder}</p>
            <p><a href="/api/health">API Health Check</a></p>
            </body></html>
            """, 500

    return app
