from flask import Flask, send_from_directory
from flask_migrate import Migrate
from flask_cors import CORS
import os
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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
        raise RuntimeError("Static folder setup failed")

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
        return {
            'status': 'healthy',
            'message': 'Harmonic Universe API is running'
        }

    # Special route to handle all static files including the Ant Design icons
    @app.route('/assets/<path:filename>')
    def serve_assets(filename):
        return send_from_directory(os.path.join(app.static_folder, 'assets'), filename)

    # Route to serve React App
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_static(path):
        if path and path.startswith('api/'):
            return app.handle_request()

        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    return app
