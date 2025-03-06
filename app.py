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
from config import current_config
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_migrate import Migrate
from dotenv import load_dotenv
from models import db, User, Universe, Scene
from auth import auth_bp
from universe_api import universe_bp
from scene_api import scene_bp
from werkzeug.exceptions import HTTPException
from flask_cors import CORS
import jwt
from functools import wraps

# Add the current directory to Python path to ensure imports work correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app(test_config=None):
    """
    Factory function that creates and returns the Flask application.
    This avoids circular imports by importing the actual app inside the function.
    """
    try:
        # Create and configure the app
        app = Flask(__name__, static_folder='static/react-app/build', static_url_path='')
        app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'harmonic-universe-secret-key')
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///harmonic.db')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

        # Configure logging
        if not app.debug:
            logging.basicConfig(level=logging.INFO)
            handler = logging.StreamHandler()
            handler.setFormatter(logging.Formatter(
                '%(asctime)s %(levelname)s: %(message)s '
                '[in %(pathname)s:%(lineno)d]'
            ))
            app.logger.addHandler(handler)
            app.logger.setLevel(logging.INFO)

        # Load configuration
        if test_config is None:
            # Load the configuration from environment variables
            app.config.from_mapping(
                SECRET_KEY=os.getenv('SECRET_KEY', 'dev_key_only_for_development'),
                SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL', 'sqlite:///harmonic_universe.db'),
                SQLALCHEMY_TRACK_MODIFICATIONS=False,
            )
        else:
            # Load the test configuration
            app.config.from_mapping(test_config)

        # Ensure the instance folder exists
        try:
            os.makedirs(app.instance_path)
        except OSError:
            pass

        # Initialize database
        db.init_app(app)
        migrate = Migrate(app, db)
        CORS(app)  # Enable CORS for all routes

        # Register blueprints
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(universe_bp, url_prefix='/api/universes')
        app.register_blueprint(scene_bp, url_prefix='/api/scenes')

        # Token required decorator
        def token_required(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                token = None
                auth_header = request.headers.get('Authorization')

                if auth_header:
                    if auth_header.startswith('Bearer '):
                        token = auth_header.split(' ')[1]

                if not token:
                    return jsonify({'message': 'Token is missing'}), 401

                try:
                    data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                    current_user = User.query.get(data['user_id'])

                    if not current_user:
                        return jsonify({'message': 'User not found'}), 401
                except jwt.ExpiredSignatureError:
                    return jsonify({'message': 'Token has expired'}), 401
                except jwt.InvalidTokenError:
                    return jsonify({'message': 'Invalid token'}), 401

                return f(current_user, *args, **kwargs)

            return decorated

        # Error handlers
        @app.errorhandler(404)
        def not_found(e):
            return jsonify({"message": "Resource not found"}), 404

        @app.errorhandler(403)
        def forbidden(e):
            return jsonify({"message": "Access forbidden"}), 403

        @app.errorhandler(500)
        def server_error(e):
            app.logger.error(f"Server error: {str(e)}")
            return jsonify({"message": "Internal server error"}), 500

        @app.errorhandler(HTTPException)
        def handle_http_exception(e):
            response = e.get_response()
            response.data = jsonify({
                "code": e.code,
                "name": e.name,
                "message": e.description,
            }).data
            response.content_type = "application/json"
            return response

        # Health check endpoint
        @app.route('/api/health')
        def health_check():
            try:
                # Check database connection
                db.session.execute('SELECT 1')
                return jsonify({'status': 'healthy', 'database': 'connected'})
            except Exception as e:
                app.logger.error(f"Health check failed: {str(e)}")
                return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

        # Serve the single-page application for any other route
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_app(path):
            if path != "" and os.path.exists(app.static_folder + '/' + path):
                return send_from_directory(app.static_folder, path)
            else:
                return send_from_directory(app.static_folder, 'index.html')

        return app
    except Exception as e:
        import traceback
        logger.error(f"Error creating app: {e}")
        logger.error(traceback.format_exc())

        # Create a minimal emergency app if everything else fails
        minimal_app = Flask(__name__)

        @minimal_app.route('/')
        def minimal_index():
            return "Minimal emergency Flask app is running. There was an error creating the full app."

        @minimal_app.route('/api/health')
        def minimal_health():
            return jsonify({
                "status": "degraded",
                "message": "Minimal emergency app is running due to errors",
                "error": str(e)
            })

        return minimal_app

# Create a global app instance if not already defined
if 'app' not in globals():
    try:
        from app import create_app  # Import your factory function
        app = create_app()  # Create the app
    except ImportError:
        print("Error: Cannot find create_app function")
        sys.exit(1)

# Run the application when executed directly
if __name__ == "__main__":
    try:
        # Get port from environment with fallback
        port = int(os.environ.get("PORT", 5000))
        logger.info(f"Starting app on port {port}")
        app.run(host="0.0.0.0", port=port)
    except Exception as e:
        logger.error(f"Error starting application: {e}")
        traceback.print_exc()
        sys.exit(1)
