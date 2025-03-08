from flask import Flask, send_from_directory, jsonify, current_app, redirect, url_for, request, Response
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
    """
    Create and configure the Flask application.
    All routes should be defined here to ensure consistency between
    local development and Render.com production.
    """
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
        logger.info(f"Creating index.html at {index_html_path}")
        # Create default index.html file immediately
        try:
            with open(index_html_path, 'w') as f:
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
            logger.info(f"Successfully created index.html at {index_html_path}")
        except Exception as e:
            logger.error(f"Failed to create index.html: {e}")

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
        """Health check endpoint for monitoring."""
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
        """Serve asset files from the assets directory."""
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
        """Debug endpoint to display application information."""
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

    # Add all the application routes

    # Landing page / React App route
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_static(path):
        """
        Serve static files or the React app.
        This route handles all paths not matching other routes.
        """
        logger.info(f"Serving path: {path}")

        # For API routes, let Flask handle them normally
        if path and path.startswith('api/'):
            return app.handle_request()

        # Try to serve the specific file if it exists
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            logger.info(f"Serving static file: {path}")
            return send_from_directory(app.static_folder, path)

        # Otherwise serve index.html for client-side routing
        try:
            index_path = os.path.join(app.static_folder, 'index.html')
            logger.info(f"Serving index.html from {index_path}")

            # Read the file content directly
            with open(index_path, 'r') as f:
                content = f.read()

            # Log content length for debugging
            logger.info(f"index.html content length: {len(content)} bytes")

            # Create a response with proper content length and type
            response = app.response_class(
                response=content,
                status=200,
                mimetype='text/html'
            )

            # Explicitly set Content-Length header
            response.headers['Content-Length'] = str(len(content))

            return response
        except Exception as e:
            logger.error(f"Error serving index.html: {e}")
            return f"Error loading application: {str(e)}", 500

    # Add a debugging route to directly check the index.html content
    @app.route('/debug-index')
    def debug_index():
        """Debug endpoint to display the index.html content."""
        index_path = os.path.join(app.static_folder, 'index.html')
        try:
            with open(index_path, 'r') as f:
                content = f.read()

            # Log the content length and a preview
            logger.info(f"Debug - Index.html content length: {len(content)} bytes")
            logger.info(f"Preview: {content[:200]}...")

            # Return the full content with correct headers
            response = app.response_class(
                response=content,
                status=200,
                mimetype='text/html'
            )
            response.headers['Content-Length'] = str(len(content))
            return response
        except Exception as e:
            logger.error(f"Error reading index.html: {e}")
            return f"Error: {str(e)}", 500

    # Login route
    @app.route('/login')
    def login():
        """Handle login requests."""
        # For now, just redirect to home page or return a placeholder
        # In a real implementation, this would show a login form or handle login logic
        return redirect('/')

    # Signup route
    @app.route('/signup')
    def signup():
        """Handle signup requests."""
        # For now, just redirect to home page or return a placeholder
        # In a real implementation, this would show a signup form or handle signup logic
        return redirect('/')

    # Demo route
    @app.route('/demo')
    def demo():
        """Handle demo requests."""
        # For now, just redirect to home page or return a placeholder
        # In a real implementation, this would load the demo experience
        return redirect('/')

    # Add more routes for your application as needed
    # For example: @app.route('/api/users'), etc.

    return app
