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

def create_app(config_name='default'):
    """Create Flask application."""
    app = Flask(__name__)

    # Load configuration
    if isinstance(config_name, str):
        app.config.from_object(config[config_name])
    else:
        app.config.from_object(config_name)

    # Initialize extensions with explicit async_mode
    socketio.init_app(app, async_mode='threading', message_queue=app.config['SOCKETIO_MESSAGE_QUEUE'])
    init_extensions(app)

    # Register blueprints
    from .routes import register_routes
    register_routes(app)

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
