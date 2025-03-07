from flask import Flask, send_from_directory, jsonify, current_app
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging
import sys
import traceback

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("app_init")

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    """Application factory function"""
    # Get static folder from environment or use default
    static_folder = os.environ.get('STATIC_DIR', '/opt/render/project/src/static')
    logger.info(f"Using static folder: {static_folder}")

    # Create and configure the Flask app
    app = Flask(__name__,
                static_folder=static_folder,
                static_url_path='/')  # Serve from root path

    # Enable CORS
    CORS(app)

    # Configure app
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///app.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SEND_FILE_MAX_AGE_DEFAULT=0,
        STATIC_FOLDER=static_folder,  # Explicitly set in config
    )

    # Ensure static directory exists
    try:
        os.makedirs(static_folder, exist_ok=True)
        os.chmod(static_folder, 0o755)
        logger.info(f"Static directory ready: {static_folder}")

        # List contents of static directory
        if os.path.exists(static_folder):
            contents = os.listdir(static_folder)
            logger.info(f"Static directory contents: {contents}")

            # Check index.html
            index_path = os.path.join(static_folder, 'index.html')
            if os.path.exists(index_path):
                logger.info(f"index.html found: {index_path}")
                logger.info(f"index.html permissions: {oct(os.stat(index_path).st_mode)[-3:]}")
            else:
                logger.warning(f"index.html not found at {index_path}")
    except Exception as e:
        logger.error(f"Static directory setup failed: {e}")
        logger.error(traceback.format_exc())
        raise  # Fail fast if static directory setup fails

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    from app.auth import auth_bp
    app.register_blueprint(auth_bp)

    from app.routes import main_bp
    app.register_blueprint(main_bp)

    # Health check endpoint for Render
    @app.route('/health')
    def health():
        try:
            # Basic application check
            static_exists = os.path.exists(app.static_folder)
            index_exists = os.path.exists(os.path.join(app.static_folder, 'index.html'))

            # Get static directory contents
            static_contents = os.listdir(app.static_folder) if static_exists else []

            return jsonify({
                "status": "healthy",
                "static": {
                    "exists": static_exists,
                    "path": app.static_folder,
                    "index": index_exists,
                    "contents": static_contents
                },
                "environment": {
                    "python_path": sys.path,
                    "virtual_env": os.environ.get('VIRTUAL_ENV'),
                    "static_url_path": app.static_url_path,
                    "render": os.environ.get('RENDER')
                }
            }), 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            logger.error(traceback.format_exc())
            return jsonify({
                "status": "unhealthy",
                "error": str(e),
                "traceback": traceback.format_exc()
            }), 500

    # Root route that serves index.html
    @app.route('/')
    def serve_root():
        try:
            logger.info(f"Serving root from {app.static_folder}")
            if not os.path.exists(os.path.join(app.static_folder, 'index.html')):
                logger.error(f"index.html not found in {app.static_folder}")
                return jsonify({"error": "index.html not found"}), 404
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            logger.error(f"Error serving root: {e}")
            logger.error(traceback.format_exc())
            return jsonify({
                "error": "Error serving index.html",
                "details": str(e),
                "path": os.path.join(app.static_folder, 'index.html')
            }), 500

    # Catch-all route for static files and SPA
    @app.route('/<path:path>')
    def serve_static(path):
        try:
            logger.info(f"Attempting to serve: {path}")
            file_path = os.path.join(app.static_folder, path)

            if os.path.exists(file_path) and os.path.isfile(file_path):
                logger.info(f"Serving static file: {file_path}")
                return send_from_directory(app.static_folder, path)

            logger.info(f"File not found, serving index.html for SPA routing")
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            logger.error(f"Error serving {path}: {e}")
            logger.error(traceback.format_exc())
            return jsonify({
                "error": f"Error serving {path}",
                "details": str(e),
                "path": file_path
            }), 500

    # Log final configuration
    logger.info("=== Flask Application Configuration ===")
    logger.info(f"Static folder: {app.static_folder}")
    logger.info(f"Static URL path: {app.static_url_path}")
    logger.info(f"Debug mode: {app.debug}")
    logger.info(f"Environment: {app.env}")

    if os.path.exists(app.static_folder):
        logger.info(f"Static folder contents: {os.listdir(app.static_folder)}")
    else:
        logger.error(f"Static folder does not exist: {app.static_folder}")

    return app
