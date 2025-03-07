from flask import Flask, send_from_directory, jsonify, current_app, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import os
import shutil
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

def ensure_static_directory(app):
    """Ensure static directory exists and contains necessary files"""
    static_dir = app.config['STATIC_FOLDER']
    try:
        # Create static directory if it doesn't exist
        os.makedirs(static_dir, exist_ok=True)
        os.chmod(static_dir, 0o755)
        logger.info(f"Ensured static directory exists: {static_dir}")

        # Create index.html if it doesn't exist
        index_path = os.path.join(static_dir, 'index.html')
        if not os.path.exists(index_path):
            with open(index_path, 'w') as f:
                f.write("""<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #f5f5f5;
        }
        h1 { color: #333; }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Welcome to the Harmonic Universe application!</p>
        <p id="status">Checking application status...</p>
    </div>
    <script>
        fetch('/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').textContent =
                    'Status: ' + (data.status || 'Unknown');
            })
            .catch(error => {
                document.getElementById('status').textContent =
                    'Status: Connection Error';
            });
    </script>
</body>
</html>""")
            os.chmod(index_path, 0o644)
            logger.info(f"Created index.html at {index_path}")

        # Copy frontend build files if they exist
        frontend_build = os.path.join('frontend', 'dist')
        if os.path.exists(frontend_build):
            for item in os.listdir(frontend_build):
                src = os.path.join(frontend_build, item)
                dst = os.path.join(static_dir, item)
                if os.path.isfile(src):
                    shutil.copy2(src, dst)
                elif os.path.isdir(src):
                    shutil.copytree(src, dst, dirs_exist_ok=True)
            logger.info("Copied frontend build files to static directory")

        return True
    except Exception as e:
        logger.error(f"Static directory setup failed: {e}")
        logger.error(traceback.format_exc())
        return False

def create_app():
    """Application factory function"""
    # Get static folder from environment or use default
    static_folder = os.environ.get('STATIC_DIR', '/opt/render/project/src/static')
    logger.info(f"Using static folder: {static_folder}")

    # Create and configure the Flask app
    app = Flask(__name__, static_folder=static_folder, static_url_path='')

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

    # Ensure static directory is set up
    if not ensure_static_directory(app):
        logger.error("Failed to set up static directory")
        raise RuntimeError("Static directory setup failed")

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

    # Health check endpoint
    @app.route('/health')
    def health():
        try:
            # Verify static directory
            static_dir = app.config['STATIC_FOLDER']
            static_exists = os.path.exists(static_dir)
            index_exists = os.path.exists(os.path.join(static_dir, 'index.html'))
            static_contents = os.listdir(static_dir) if static_exists else []

            # Check database connection
            db_healthy = True
            try:
                db.session.execute('SELECT 1')
            except Exception as e:
                db_healthy = False
                logger.error(f"Database health check failed: {e}")

            response = {
                "status": "healthy" if (static_exists and index_exists and db_healthy) else "unhealthy",
                "static": {
                    "exists": static_exists,
                    "path": static_dir,
                    "index": index_exists,
                    "contents": static_contents
                },
                "database": "connected" if db_healthy else "disconnected",
                "environment": {
                    "python_path": sys.path,
                    "virtual_env": os.environ.get('VIRTUAL_ENV'),
                    "render": os.environ.get('RENDER'),
                    "port": os.environ.get('PORT', '10000')
                }
            }
            logger.info(f"Health check response: {response}")
            return jsonify(response), 200 if response["status"] == "healthy" else 500
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

            if path == 'health':
                return health()

            static_dir = app.config['STATIC_FOLDER']
            file_path = os.path.join(static_dir, path)

            if os.path.exists(file_path) and os.path.isfile(file_path):
                logger.info(f"Serving static file: {file_path}")
                try:
                    return send_from_directory(static_dir, path)
                except Exception as e:
                    logger.error(f"Error sending file {path}: {e}")
                    return jsonify({"error": "File serving error"}), 500
            else:
                logger.info(f"File {path} not found, serving index.html")
                return send_from_directory(static_dir, 'index.html')
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
