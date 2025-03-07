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
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app_init")

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    """Application factory function"""
    # Use Render's static directory in production, local in development
    if os.environ.get('RENDER'):
        static_folder = '/opt/render/project/src/static'
    else:
        static_folder = os.path.join(os.getcwd(), 'static')

    # Create and configure the Flask app
    app = Flask(__name__,
                static_folder=static_folder,
                static_url_path='')  # Serve from root path

    # Enable CORS
    CORS(app)

    # Configure app
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///app.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SEND_FILE_MAX_AGE_DEFAULT=0,
    )

    # Ensure static directory exists
    try:
        os.makedirs(static_folder, exist_ok=True)
        os.chmod(static_folder, 0o755)
        logger.info(f"Static directory ready: {static_folder}")
    except Exception as e:
        logger.error(f"Static directory setup failed: {e}")
        logger.error(traceback.format_exc())

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

            return jsonify({
                "status": "healthy",
                "static": {
                    "exists": static_exists,
                    "path": app.static_folder,
                    "index": index_exists
                }
            }), 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                "status": "unhealthy",
                "error": str(e)
            }), 500

    # Root route that serves index.html
    @app.route('/')
    def serve_root():
        try:
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            logger.error(f"Error serving root: {e}")
            return jsonify({
                "error": "Index file not found",
                "path": os.path.join(app.static_folder, 'index.html')
            }), 404

    # Catch-all route for static files and SPA
    @app.route('/<path:path>')
    def serve_static(path):
        try:
            file_path = os.path.join(app.static_folder, path)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return send_from_directory(app.static_folder, path)
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            logger.error(f"Error serving {path}: {e}")
            return jsonify({
                "error": f"Error serving {path}",
                "path": file_path
            }), 500

    # Log configuration
    logger.info(f"Static folder: {app.static_folder}")
    logger.info(f"Static URL path: {app.static_url_path}")
    if os.path.exists(app.static_folder):
        logger.info(f"Static folder contents: {os.listdir(app.static_folder)}")

    return app
