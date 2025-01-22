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
    app.config.from_object(config[config_name])

    # Initialize extensions
    init_extensions(app)

    # Register blueprints
    from .routes import register_routes
    register_routes(app)

    # Register error handlers
    register_error_handlers(app)

    # Initialize WebSocket service
    from .websocket import WebSocketService
    websocket_service = WebSocketService(socketio)
    websocket_service.register_handlers()

    return app
