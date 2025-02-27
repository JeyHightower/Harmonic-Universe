"""Flask application factory."""
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

    # Register blueprints
    from .api.routes.register_routes import register_routes
    register_routes(app)

    # Register error handlers
    from app.core.error_handlers import register_error_handlers
    register_error_handlers(app)

    @app.route('/health')
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

    return app
