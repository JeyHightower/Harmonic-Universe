"""Flask application factory."""
from flask import Flask
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_socketio import SocketIO
from .config import config
from .utils.error_handlers import register_error_handlers
from datetime import datetime
from .extensions import db, migrate, jwt, cors, limiter, socketio, init_extensions
from .cli import reset_test_db

def create_app(config_name='development'):
    """Create Flask application."""
    app = Flask(__name__)

    # Load configuration
    if config_name == 'testing':
        app.config.from_object('app.config.TestingConfig')
    else:
        app.config.from_object('app.config.DevelopmentConfig')

    # Initialize extensions with explicit async_mode
    socketio.init_app(app, async_mode='threading', message_queue=app.config['SOCKETIO_MESSAGE_QUEUE'])
    init_extensions(app)

    # Register CLI commands
    app.cli.add_command(reset_test_db)

    # Register blueprints
    from .routes import auth_bp, universe_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')

    # Register error handlers
    register_error_handlers(app)

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

    @jwt.user_identity_loader
    def user_identity_lookup(user):
        """Get user identity for JWT."""
        if isinstance(user, int):
            return str(user)
        return str(user.id) if user else None

    return app
