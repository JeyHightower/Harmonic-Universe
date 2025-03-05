from flask import Flask, send_from_directory
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from .core.config import Config
import os
import logging
from .db.session import init_engine, Base, db_session
from .middleware.react_patch import init_app as init_react_patch

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize extensions
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO()
bcrypt = Bcrypt()

def create_app(config_class=Config):
    app = Flask(__name__, static_folder='../../static', static_url_path='')
    app.config.from_object(config_class)

    # Load the .env file
    from dotenv import load_dotenv
    load_dotenv()

    # Initialize database
    database_url = app.config['SQLALCHEMY_DATABASE_URI']
    logger.debug(f"Using database URL: {database_url}")

    # Initialize database engine with the Flask config URL
    engine = init_engine(database_url)

    # Set up SQLAlchemy session
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    # Initialize extensions
    migrate.init_app(app, Base)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Import and register blueprints/routes
    from .api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api/v1')

    # Import and register models to ensure they are known to SQLAlchemy
    from .models import User, Universe, PhysicsObject, PhysicsParameters, PhysicsConstraint, AudioTrack, Visualization, Scene

    # Initialize WebSocket
    socketio.init_app(app, cors_allowed_origins="*")

    # Import socket events handlers
    from .websocket import init_socketio
    init_socketio(socketio)

    # Initialize React patch middleware for Ant Icons fix
    init_react_patch(app)

    # Register health check route
    @app.route('/api/v1/health')
    def health_check():
        return {
            'status': 'healthy',
            'message': 'Harmonic Universe API is running'
        }

    # Special route to handle all static files including the Ant Design icons
    @app.route('/assets/<path:filename>')
    def serve_assets(filename):
        return send_from_directory(os.path.join(app.static_folder, 'assets'), filename)

    # JWT error handlers
    @jwt.unauthorized_loader
    def handle_unauthorized_loader(msg):
        return {
            'message': 'Missing Authorization header',
            'error': msg
        }, 401

    @jwt.invalid_token_loader
    def handle_invalid_token(msg):
        return {
            'message': 'Invalid token',
            'error': msg
        }, 401

    @jwt.expired_token_loader
    def handle_expired_token(jwt_header, jwt_payload):
        return {
            'message': 'Token has expired',
            'error': 'Token expired'
        }, 401

    # Route to serve React App
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def react_root(path):
        if path and path.startswith('assets/'):
            # Extract the file name from the path
            file_name = path.replace('assets/', '')
            return send_from_directory(os.path.join(app.static_folder, 'assets'), file_name)
        if path == 'favicon.ico':
            return app.send_from_directory('public', 'favicon.ico')
        return app.send_static_file('index.html')

    return app
