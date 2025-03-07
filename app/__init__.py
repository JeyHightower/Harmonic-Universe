from flask import Flask, current_app
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
from dotenv import load_dotenv
import logging
import sys

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app_init")

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    """Application factory function"""
    # Find the project root directory (where the app module is)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Define the absolute path to the static folder
    static_folder = os.path.join(project_root, 'static')

    # For Render deployment, make sure to use the correct path
    if os.environ.get('RENDER') == 'true':
        logger.info("Running in Render environment, checking for static files")
        render_static = '/opt/render/project/src/static'
        if os.path.exists(render_static):
            static_folder = render_static
            logger.info(f"Using Render static folder: {render_static}")

    # Ensure the static folder exists
    if not os.path.exists(static_folder):
        try:
            os.makedirs(static_folder, exist_ok=True)
            logger.info(f"Created static folder at {static_folder}")
        except Exception as e:
            logger.error(f"Failed to create static folder: {e}")

    # Log what we found
    logger.info(f"Project root directory: {project_root}")
    logger.info(f"Static folder absolute path: {static_folder}")
    logger.info(f"Static folder exists: {os.path.exists(static_folder)}")

    # If static folder exists, log its contents
    if os.path.exists(static_folder):
        try:
            files = os.listdir(static_folder)
            logger.info(f"Static folder contents: {files}")
        except Exception as e:
            logger.error(f"Could not list static folder contents: {e}")

    # Create the Flask app with the correct static folder
    app = Flask(__name__, static_folder=static_folder)

    # Log critical paths
    logger.info(f"Current directory: {os.getcwd()}")
    logger.info(f"App static folder: {app.static_folder}")
    logger.info(f"Python path: {sys.path}")

    # Set up logging
    app.logger.setLevel(logging.INFO)

    # Configure app
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///app.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    # Initialize extensions with better error handling
    try:
        db.init_app(app)
        migrate.init_app(app, db)
        app.logger.info("Database extensions initialized successfully")
    except Exception as e:
        app.logger.error(f"Failed to initialize database extensions: {str(e)}")

    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass

    # Register blueprints
    try:
        from app.auth import auth_bp
        app.register_blueprint(auth_bp)
        app.logger.info("Registered auth blueprint")

        from app.routes import main_bp
        app.register_blueprint(main_bp)
        app.logger.info("Registered main routes blueprint")
    except Exception as e:
        app.logger.error(f"Failed to register blueprints: {str(e)}")

    # Check if static directory contents exist and are accessible
    @app.before_request
    def check_static_files():
        if not hasattr(check_static_files, 'already_checked'):
            with app.app_context():
                static_folder = current_app.static_folder
                index_path = os.path.join(static_folder, 'index.html')

                if os.path.exists(index_path):
                    app.logger.info(f"index.html exists at {index_path}")
                else:
                    app.logger.warning(f"index.html does not exist at {index_path}")

                    # Try to create fallback index.html
                    try:
                        os.makedirs(static_folder, exist_ok=True)
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
        <p>Application is running! This is a fallback page created by app.before_request.</p>
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
</html>""")
                        app.logger.info(f"Created fallback index.html at {index_path}")
                    except Exception as e:
                        app.logger.error(f"Failed to create fallback index.html: {str(e)}")

            # Mark as checked so we don't repeat this check for every request
            check_static_files.already_checked = True

    # Add a special route for Render health check
    @app.route('/api/health')
    def health_check():
        from flask import jsonify
        return jsonify({"status": "healthy", "message": "Application is running"})

    # Add a catch-all route for the SPA
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        from flask import send_from_directory
        if path and (path.startswith('api/') or path.startswith('api')):
            # This should be handled by the API routes
            from flask import abort
            abort(404)
        # Otherwise, serve the index.html for client-side routing
        app.logger.debug(f"Serving index.html for path: {path}")
        try:
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            app.logger.error(f"Error serving index.html: {str(e)}")
            return "Error serving application. Please check server logs.", 500

    return app
