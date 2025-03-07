from flask import Flask, send_from_directory, jsonify, current_app
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import os
import stat
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

def ensure_directory_permissions(path):
    """Ensure all directories in path have correct permissions"""
    current = "/"
    for part in path.split("/"):
        if not part:
            continue
        current = os.path.join(current, part)
        if os.path.exists(current):
            try:
                os.chmod(current, stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)  # 755
                logger.info(f"Set permissions for: {current}")
            except Exception as e:
                logger.warning(f"Could not set permissions for {current}: {e}")

def create_default_index():
    """Create a default index.html file"""
    return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body { font-family: system-ui; margin: 0; padding: 2rem; text-align: center; }
        .status { margin-top: 2rem; padding: 1rem; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <div class="status">
        <p>Application Status: <span id="status">Checking...</span></p>
    </div>
    <script>
        fetch('/api/health').then(r => r.json()).then(data => {
            document.getElementById('status').textContent = data.status;
        }).catch(() => {
            document.getElementById('status').textContent = 'Error';
        });
    </script>
</body>
</html>"""

def create_app():
    """Application factory function"""
    # Explicitly set the static folder to Render's absolute path
    static_folder = '/opt/render/project/src/static'

    # Create and configure the Flask app first
    app = Flask(__name__,
                static_folder=static_folder,
                static_url_path='')

    # Enable CORS
    CORS(app)

    # Configure app
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///app.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SEND_FILE_MAX_AGE_DEFAULT=0,
    )

    # Ensure static directory exists with proper permissions
    try:
        os.makedirs(static_folder, exist_ok=True)
        ensure_directory_permissions(static_folder)

        # Create index.html if it doesn't exist
        index_path = os.path.join(static_folder, 'index.html')
        if not os.path.exists(index_path):
            with open(index_path, 'w') as f:
                f.write(create_default_index())
            os.chmod(index_path, 0o644)
            logger.info(f"Created index.html at {index_path}")

        logger.info(f"Static directory ready: {static_folder}")
        logger.info(f"Contents: {os.listdir(static_folder)}")
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

    # Simple health check endpoint
    @app.route('/api/health')
    def health_check():
        try:
            # Basic application check
            static_exists = os.path.exists(app.static_folder)
            index_exists = os.path.exists(os.path.join(app.static_folder, 'index.html'))

            return jsonify({
                'status': 'healthy',
                'message': 'Application is running',
                'static': {
                    'exists': static_exists,
                    'index': index_exists,
                    'path': app.static_folder
                }
            })
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'error': str(e)
            }), 500

    # Static file serving
    @app.route('/', defaults={'path': 'index.html'})
    @app.route('/<path:path>')
    def serve_static(path):
        try:
            if not path or path == '/':
                path = 'index.html'

            full_path = os.path.join(app.static_folder, path)
            if os.path.exists(full_path) and os.path.isfile(full_path):
                return send_from_directory(app.static_folder, path)

            # SPA fallback
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            logger.error(f"Error serving {path}: {e}")
            return jsonify({'error': str(e)}), 500

    return app
