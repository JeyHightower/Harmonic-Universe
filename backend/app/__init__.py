"""Flask application factory."""
from flask import Flask
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from .config import config
from .extensions import migrate, jwt, socketio, cache, db, init_app
from .utils.error_handlers import register_error_handlers
import redis
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv(override=True)

# Initialize extensions
mail = Mail()
ma = Marshmallow()
redis_client = None

def create_app(config_name='development'):
    """Create and configure an instance of the Flask application."""
    app = Flask(__name__, instance_relative_config=True)

    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Ensure we're using the right config
    if config_name not in config:
        app.logger.warning(f"Config '{config_name}' not found, using 'development'")
        config_name = 'development'

    if config_name == 'testing':
        app.config.update({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'JWT_SECRET_KEY': 'test-secret-key',
            'SECRET_KEY': 'test-secret-key',
            'SOCKETIO_ASYNC_MODE': 'threading',
            'SOCKETIO_MANAGE_SESSION': True,
            'SOCKETIO_MESSAGE_QUEUE': None,
            'SOCKETIO_PING_TIMEOUT': 10,
            'SOCKETIO_PING_INTERVAL': 15,
            'REDIS_URL': None
        })
    else:
        # Create config instance
        config_instance = config[config_name]()

        # Load config from object
        app.config.from_object(config_instance)

        # Override with environment variables if set
        app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', app.config.get('SECRET_KEY'))
        app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', app.config.get('JWT_SECRET_KEY'))

        # Redis configuration
        redis_url = app.config.get('REDIS_URL', 'redis://localhost:6379/0')
        app.config.update({
            'SOCKETIO_ASYNC_MODE': 'eventlet',
            'SOCKETIO_MANAGE_SESSION': True,
            'SOCKETIO_MESSAGE_QUEUE': redis_url,
            'SOCKETIO_PING_TIMEOUT': int(os.getenv('SOCKETIO_PING_TIMEOUT', '10')),
            'SOCKETIO_PING_INTERVAL': int(os.getenv('SOCKETIO_PING_INTERVAL', '15'))
        })

        # Test Redis connection
        try:
            global redis_client
            redis_client = redis.from_url(redis_url)
            redis_client.ping()
        except redis.ConnectionError:
            app.logger.warning('Redis connection failed. WebSocket message queue will not work properly.')
        except Exception as e:
            app.logger.error(f'Redis error: {str(e)}')

    # Initialize logging
    config[config_name].init_logging(app)
    app.logger.info(f'Starting application in {config_name} mode')

    # Initialize extensions
    init_app(app)
    mail.init_app(app)
    ma.init_app(app)
    CORS(app)

    # Register error handlers
    register_error_handlers(app)

    # Import and register blueprints after db initialization
    from .routes.auth import auth_bp
    from .routes.profile import profile_bp
    from .routes.universe import universe_bp
    from .routes.collaboration import collaboration

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(collaboration, url_prefix='/api/collaboration')

    # Initialize WebSocket service
    from .websocket import WebSocketService
    app.websocket_manager = WebSocketService(socketio)
    app.websocket_manager.register_handlers()

    # Additional JWT configuration
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        """Look up user from JWT data."""
        from .models import User
        identity = jwt_data["sub"]
        return User.query.get(identity)

    # Register CLI commands
    from .cli import register_commands
    register_commands(app)

    app.logger.info('Application initialization completed')
    return app
