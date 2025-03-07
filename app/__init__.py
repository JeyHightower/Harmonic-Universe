from flask import Flask, send_from_directory, jsonify, current_app, request
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
                static_folder=None)  # Disable automatic static serving

    # Enable CORS
    CORS(app)

    # Configure app
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///app.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SEND_FILE_MAX_AGE_DEFAULT=0,
        STATIC_FOLDER=static_folder,
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
                # Create a minimal index.html
                with open(index_path, 'w') as f:
                    f.write("""
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>Welcome to the Harmonic Universe application!</p>
</body>
</html>
""")
                os.chmod(index_path, 0o644)
                logger.info("Created minimal index.html")
    except Exception as e:
        logger.error(f"Static directory setup failed: {e}")
        logger.error(traceback.format_exc())
        raise

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    from app.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    from app.routes import main_bp
    app.register_blueprint(main_bp, url_prefix='/api')

    @app.before_request
    def log_request_info():
        logger.info(f"Request: {request.method} {request.path}")
        logger.info(f"Headers: {dict(request.headers)}")

    # Health check endpoint
    @app.route('/health')
    def health():
        try:
            static_exists = os.path.exists(app.config['STATIC_FOLDER'])
            index_exists = os.path.exists(os.path.join(app.config['STATIC_FOLDER'], 'index.html'))
            static_contents = os.listdir(app.config['STATIC_FOLDER']) if static_exists else []

            response = {
                "status": "healthy",
                "static": {
                    "exists": static_exists,
                    "path": app.config['STATIC_FOLDER'],
                    "index": index_exists,
                    "contents": static_contents
                },
                "environment": {
                    "python_path": sys.path,
                    "virtual_env": os.environ.get('VIRTUAL_ENV'),
                    "render": os.environ.get('RENDER'),
                    "port": os.environ.get('PORT', '10000')
                }
            }
            logger.info(f"Health check response: {response}")
            return jsonify(response), 200
        except Exception as e:
            error_response = {
                "status": "unhealthy",
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            logger.error(f"Health check failed: {error_response}")
            return jsonify(error_response), 500

    # Static file serving
    @app.route('/', defaults={'path': 'index.html'})
    @app.route('/<path:path>')
    def serve_static(path):
        try:
            logger.info(f"Attempting to serve: {path}")
            if path.startswith('api/'):
                return jsonify({"error": "Not found"}), 404

            static_folder = app.config['STATIC_FOLDER']
            file_path = os.path.join(static_folder, path)

            if os.path.exists(file_path) and os.path.isfile(file_path):
                logger.info(f"Serving static file: {file_path}")
                try:
                    return send_from_directory(static_folder, path)
                except Exception as e:
                    logger.error(f"Error sending file {path}: {e}")
                    return jsonify({"error": "File serving error"}), 500
            else:
                logger.info(f"File {path} not found, serving index.html")
                return send_from_directory(static_folder, 'index.html')
        except Exception as e:
            logger.error(f"Error serving {path}: {e}")
            logger.error(traceback.format_exc())
            return jsonify({
                "error": f"Error serving {path}",
                "details": str(e)
            }), 500

    # Log final configuration
    logger.info("=== Flask Application Configuration ===")
    logger.info(f"Static folder: {app.config['STATIC_FOLDER']}")
    logger.info(f"Debug mode: {app.debug}")
    logger.info(f"Environment: {app.env}")

    return app
