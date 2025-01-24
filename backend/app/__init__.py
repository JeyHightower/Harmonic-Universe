"""Flask application factory."""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_socketio import SocketIO
from .config import config
from .utils.error_handlers import register_error_handlers
from datetime import datetime
from .extensions import db, migrate, jwt, cors, limiter, socketio, init_extensions
from .cli import reset_test_db
from redis import Redis

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
ma = Marshmallow()
redis_client = None

def create_app(config_name='development'):
    """Create Flask application."""
    app = Flask(__name__)

    # Load configuration
    if config_name == 'testing':
        app.config.from_object('app.config.TestingConfig')
    else:
        app.config.from_object('app.config.DevelopmentConfig')

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)
    CORS(app)

    # Initialize Redis
    global redis_client
    redis_client = Redis.from_url(app.config['REDIS_URL'])

    # Register CLI commands
    app.cli.add_command(reset_test_db)

    # Register blueprints
    from .routes.auth_routes import auth_bp
    from .routes.universe_routes import universe_bp
    from .routes.user_routes import user_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(user_bp, url_prefix='/api/users')

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

    # Shell context
    @app.shell_context_processor
    def make_shell_context():
        return {
            'db': db,
            'User': User,
            'Universe': Universe
        }

    return app
