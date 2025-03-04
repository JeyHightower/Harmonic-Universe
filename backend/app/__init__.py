from flask import Flask
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

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize extensions
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO()
bcrypt = Bcrypt()

def create_app(config_class=Config):
    app = Flask(__name__)
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
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
            "expose_headers": ["Content-Range", "X-Content-Range"],
            "supports_credentials": True,
            "max_age": 600
        }
    })
    socketio.init_app(app, cors_allowed_origins="*")

    # Register JWT token blocklist checker
    from app.core.jwt import is_token_in_blocklist
    jwt.token_in_blocklist_loader(is_token_in_blocklist)

    # Register blueprints
    from app.api.routes import (
        auth_bp,
        universe_bp,
        audio_bp,
        visualization_bp,
        physics_bp,
        ai_bp,
        physics_objects_bp,
        scenes_bp,
        users_bp,
        physics_parameters_bp,
        health_bp
    )
    from app.api.routes.music_flask import music_bp
    from app.api.routes.register_routes import register_routes

    # Register all routes through the central registration function
    register_routes(app)

    # Register error handlers
    from app.core.error_handlers import register_error_handlers
    register_error_handlers(app)

    @app.route('/api/v1/health')
    def health_check():
        return {'status': 'healthy'}

    # Create demo user on app startup only if SKIP_DEMO_USER is not set
    if not os.getenv('SKIP_DEMO_USER'):
        with app.app_context():
            from .seeds.demo_user import create_demo_user
            try:
                create_demo_user()
            except Exception as e:
                logger.warning(f"Failed to create demo user: {e}")

    # JWT error handlers
    @jwt.unauthorized_loader
    def handle_unauthorized_loader(msg):
        return {
            'error': 'UNAUTHORIZED',
            'msg': msg,
            'message': 'Missing or invalid authentication token',
            'status_code': 401
        }, 401

    @jwt.invalid_token_loader
    def handle_invalid_token(msg):
        return {
            'error': 'UNAUTHORIZED',
            'msg': msg,
            'message': 'Invalid authentication token',
            'status_code': 401
        }, 401

    @jwt.expired_token_loader
    def handle_expired_token(jwt_header, jwt_payload):
        return {
            'error': 'UNAUTHORIZED',
            'msg': 'Token has expired',
            'message': 'Authentication token has expired',
            'status_code': 401
        }, 401

    return app
