"""Flask extensions initialization."""
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_caching import Cache
from flask_sqlalchemy import SQLAlchemy

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
cache = Cache()

# Initialize SocketIO with basic configuration
socketio = SocketIO(
    async_mode='threading',
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True,
    manage_session=False,
    ping_timeout=5,
    ping_interval=25,
    message_queue=None
)

def init_app(app):
    """Initialize Flask extensions"""
    # Initialize SQLAlchemy
    db.init_app(app)

    # Initialize migrations
    migrate.init_app(app, db)

    # Initialize JWT
    jwt.init_app(app)

    # Initialize CORS
    cors.init_app(app)

    # Initialize cache
    if not app.config.get('TESTING'):
        cache_config = {
            'CACHE_TYPE': 'redis',
            'CACHE_REDIS_HOST': 'localhost',
            'CACHE_REDIS_PORT': 6379,
            'CACHE_REDIS_DB': 1,
            'CACHE_DEFAULT_TIMEOUT': 300
        }
        app.config.update(cache_config)
        cache.init_app(app)

    # Configure SocketIO
    socketio_config = {
        'SOCKETIO_MANAGE_SESSION': False,
        'SOCKETIO_MESSAGE_QUEUE': None if app.config.get('TESTING') else 'redis://',
        'SOCKETIO_PING_TIMEOUT': 5,
        'SOCKETIO_PING_INTERVAL': 25
    }
    app.config.update(socketio_config)
    socketio.init_app(app)

    # Import WebSocket handlers after SocketIO initialization
    if app.config.get('TESTING'):
        from app import websocket
        print("Registering test namespace")
        if '/test' in socketio.server.namespace_handlers:
            del socketio.server.namespace_handlers['/test']
        test_namespace = websocket.TestNamespace('/test')
        socketio.on_namespace(test_namespace)
        print(f"Available namespaces after registration: {socketio.server.namespace_handlers.keys()}")
        app.test_namespace = test_namespace
