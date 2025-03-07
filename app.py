"""
Root-level app.py to fix import issues on Render.com
This file provides a clean entry point for gunicorn
"""
import os
import sys
import glob
import logging
from flask import Flask, send_from_directory, current_app, make_response, jsonify, request, abort, send_file, Response
import traceback
from datetime import datetime
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException
from flask_cors import CORS
import jwt
from functools import wraps

# Add the current directory to Python path to ensure imports work correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")
logger.info(f"Starting app.py, added {current_dir} to Python path")

# Load environment variables
load_dotenv()

# Monkey patch to prevent flask_migrate imports - create a dummy module
sys.modules['flask_migrate'] = type('DummyModule', (), {
    'Migrate': type('DummyMigrate', (), {
        '__init__': lambda *args, **kwargs: None
    })
})
logger.info("Created dummy flask_migrate module")

# Check if we can import modules - don't fail if they're not available
try:
    from config import current_config
    from models import db, User, Universe, Scene
    from auth import auth_bp
    from universe_api import universe_bp
    from scene_api import scene_bp
    HAS_MODULES = True
    logger.info("Successfully imported all application modules")
except ImportError as e:
    logger.warning(f"Unable to import some modules: {e}")
    HAS_MODULES = False

def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, static_folder='static')
    logger.info("Created Flask app instance")

    # Apply configuration
    if test_config is None:
        try:
            app.config.from_object(current_config)
            app.static_folder = current_config.STATIC_FOLDER
            logger.info(f"Using static folder: {app.static_folder}")
            logger.info("Loaded configuration from current_config")
        except (NameError, ImportError) as e:
            logger.warning(f"Could not load current_config: {e}, using minimal config")
            # Use minimal config if current_config is not available
            app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-123')
            app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
            app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
            if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
                app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://', 1)
    else:
        app.config.from_mapping(test_config)
        logger.info("Loaded configuration from test_config")

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path, exist_ok=True)
        logger.info(f"Created instance path: {app.instance_path}")
    except OSError as e:
        logger.error(f"Failed to create instance path: {e}")

    # Apply ProxyFix middleware
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

    # Enable CORS
    CORS(app)
    logger.info("CORS enabled")

    # Initialize database if modules are available
    if HAS_MODULES:
        try:
            db.init_app(app)
            logger.info("Database initialized")

            # Create a dummy migrate class - we don't use Flask-Migrate anymore
            class DummyMigrate:
                def __init__(self, app, db):
                    logger.info("Using dummy migration class")
                    pass
            migrate = DummyMigrate(app, db)
            logger.info("Using dummy migrations (Flask-Migrate not required)")

        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")

            # Create dummy classes if DB initialization fails
            class DummyDB:
                def init_app(self, app):
                    pass
                def session(self):
                    class DummySession:
                        def execute(self, *args, **kwargs):
                            return "Dummy result"
                    return DummySession()
            db = DummyDB()
            logger.warning("Using dummy DB due to initialization error")

            class DummyMigrate:
                def __init__(self, app, db):
                    pass
            migrate = DummyMigrate(app, db)
            logger.warning("Using dummy migrations due to DB initialization error")

        # Register blueprints
        try:
            app.register_blueprint(auth_bp, url_prefix='/api/auth')
            app.register_blueprint(universe_bp, url_prefix='/api/universes')
            app.register_blueprint(scene_bp, url_prefix='/api/scenes')
            logger.info("Registered all blueprints")
        except Exception as e:
            logger.error(f"Failed to register blueprints: {e}")

    # Token verification decorator
    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]

            if not token:
                return jsonify({'message': 'Token is missing'}), 403

            try:
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                current_user = User.query.filter_by(id=data['id']).first() if HAS_MODULES else None
            except:
                return jsonify({'message': 'Token is invalid'}), 403

            return f(current_user, *args, **kwargs)
        return decorated

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden"}), 403

    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Server error: {e}")
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        response = e.get_response()
        response.data = jsonify({
            "code": e.code,
            "name": e.name,
            "description": e.description,
        }).data
        response.content_type = "application/json"
        return response

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        try:
            # Check database connection if available
            if HAS_MODULES:
                try:
                    db.session.execute('SELECT 1')
                    db_status = "connected"
                except Exception as db_err:
                    logger.error(f"Database health check failed: {db_err}")
                    db_status = f"error: {str(db_err)}"
            else:
                db_status = "unavailable"

            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'database': db_status,
                'environment': os.environ.get('FLASK_ENV', 'unknown')
            })
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500

    # Serve static files and the React app
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_app(path):
        if not path:
            path = 'index.html'

        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)

        # Default to index.html for client-side routing
        return send_from_directory(app.static_folder, 'index.html')

    logger.info("App setup complete")
    return app

# Create the app instance
logger.info("Creating app instance via create_app()")
app = create_app()
logger.info("App instance created successfully")

# If this file is run directly, start the development server
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting development server on port {port}")
    app.run(host='0.0.0.0', port=port)
