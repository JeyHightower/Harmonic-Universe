"""Flask extensions initialization."""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
from flask import jsonify, current_app
from flask_socketio import SocketIO
from flask_caching import Cache

db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
jwt = JWTManager()
cache = Cache(config={
    'CACHE_TYPE': 'redis',
    'CACHE_REDIS_URL': 'redis://localhost:6379/0',
    'CACHE_DEFAULT_TIMEOUT': 300
})

def create_socketio():
    """Create SocketIO instance."""
    _socketio = SocketIO(
        cors_allowed_origins="*",
        async_mode='threading',
        logger=False,
        engineio_logger=False
    )
    return _socketio

socketio = create_socketio()

def ratelimit_error_handler(e):
    """Handle rate limit exceeded errors."""
    return jsonify({
        'status': 'error',
        'message': 'Rate limit exceeded. Please try again later.'
    }), 429

def exempt_test_requests():
    """Exempt test requests from rate limiting."""
    from flask import current_app
    return current_app.config.get('TESTING', False)

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

limiter.request_filter(exempt_test_requests)

def init_extensions(app):
    """Initialize Flask extensions."""
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    migrate.init_app(app, db)
    cache.init_app(app)

    # Configure WebSocket
    socketio.init_app(app,
                     cors_allowed_origins="*",
                     async_mode='gevent',
                     message_queue='redis://localhost:6379/0',
                     channel='harmonic_universe')

    return None
