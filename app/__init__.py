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
    # Explicitly set the static folder to Render's absolute path
    static_folder = '/opt/render/project/src/static'

    # Create and configure the Flask app first
    app = Flask(__name__,
                static_folder=static_folder,
                static_url_path='')  # Serve static files from root

    # Enable CORS
    CORS(app)

    # Configure app
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///app.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SEND_FILE_MAX_AGE_DEFAULT=0,  # Disable caching for development
    )

    # Ensure the static folder exists after app creation
    if not os.path.exists(app.static_folder):
        try:
            os.makedirs(app.static_folder, exist_ok=True)
            os.chmod(app.static_folder, 0o755)  # Ensure proper permissions
            logger.info(f"Created static folder at {app.static_folder}")
        except Exception as e:
            logger.error(f"Failed to create static folder: {e}")
            logger.error(traceback.format_exc())

    # Initialize extensions with app context
    with app.app_context():
        try:
            db.init_app(app)
            migrate.init_app(app, db)
            # Test database connection
            db.engine.connect()
            logger.info("Successfully connected to database")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            logger.error(traceback.format_exc())

    # Register blueprints
    from app.auth import auth_bp
    app.register_blueprint(auth_bp)

    from app.routes import main_bp
    app.register_blueprint(main_bp)

    # Add basic health check endpoint that doesn't depend on database
    @app.route('/api/health')
    def health_check():
        try:
            # Check static folder
            static_exists = os.path.exists(app.static_folder)
            index_exists = os.path.exists(os.path.join(app.static_folder, 'index.html'))

            # Simple database check
            db_status = "unknown"
            try:
                with app.app_context():
                    db.session.execute('SELECT 1').scalar()
                    db_status = "connected"
            except Exception as db_err:
                logger.warning(f"Database check failed: {db_err}")
                db_status = "disconnected"

            response = jsonify({
                'status': 'healthy',
                'message': 'Application is running',
                'database': db_status,
                'static_folder': {
                    'path': app.static_folder,
                    'exists': static_exists,
                    'index_exists': index_exists,
                    'contents': os.listdir(app.static_folder) if static_exists else []
                }
            })
            response.headers['Cache-Control'] = 'no-cache'
            return response
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            logger.error(traceback.format_exc())
            return jsonify({
                'status': 'unhealthy',
                'message': str(e),
                'error': traceback.format_exc()
            }), 500

    # Serve static files
    @app.route('/', defaults={'path': 'index.html'})
    @app.route('/<path:path>')
    def serve_static(path):
        try:
            logger.info(f"Attempting to serve: {path}")
            if not path or path == '/':
                path = 'index.html'

            file_path = os.path.join(app.static_folder, path)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                logger.info(f"Serving file: {file_path}")
                response = send_from_directory(app.static_folder, path)
                response.headers['Cache-Control'] = 'no-cache'
                return response

            # Default to index.html for SPA routing
            logger.info(f"Path {path} not found, serving index.html")
            response = send_from_directory(app.static_folder, 'index.html')
            response.headers['Cache-Control'] = 'no-cache'
            return response
        except Exception as e:
            logger.error(f"Error serving {path}: {e}")
            logger.error(traceback.format_exc())
            return jsonify({
                'error': str(e),
                'path': path,
                'traceback': traceback.format_exc()
            }), 500

    # Log app configuration
    logger.info(f"Static folder: {app.static_folder}")
    logger.info(f"Static URL path: {app.static_url_path}")
    logger.info(f"Static folder exists: {os.path.exists(app.static_folder)}")
    if os.path.exists(app.static_folder):
        logger.info(f"Static folder contents: {os.listdir(app.static_folder)}")

    return app
