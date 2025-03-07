from flask import Flask, send_from_directory, jsonify
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
    # Explicitly set the static folder to Render's absolute path
    static_folder = '/opt/render/project/src/static'

    # Ensure the static folder exists
    if not os.path.exists(static_folder):
        try:
            os.makedirs(static_folder, exist_ok=True)
            logger.info(f"Created static folder at {static_folder}")
        except Exception as e:
            logger.error(f"Failed to create static folder: {e}")

    # Create the Flask app with the correct static folder
    app = Flask(__name__,
                static_folder=static_folder,
                static_url_path='')

    # Configure app
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///app.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SEND_FILE_MAX_AGE_DEFAULT=0,  # Disable caching for development
    )

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    from app.auth import auth_bp
    app.register_blueprint(auth_bp)

    from app.routes import main_bp
    app.register_blueprint(main_bp)

    # Add health check endpoint
    @app.route('/api/health')
    def health_check():
        try:
            # Try to connect to the database
            db.session.execute('SELECT 1')
            return jsonify({
                'status': 'healthy',
                'message': 'Application is running',
                'database': 'connected'
            })
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'message': str(e),
                'database': 'disconnected'
            }), 500

    # Add catch-all route for SPA
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    # Log app configuration
    logger.info(f"Static folder: {app.static_folder}")
    logger.info(f"Static URL path: {app.static_url_path}")
    logger.info(f"Static folder exists: {os.path.exists(app.static_folder)}")
    if os.path.exists(app.static_folder):
        logger.info(f"Static folder contents: {os.listdir(app.static_folder)}")

    return app
