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
cache = Cache(config={"CACHE_TYPE": "SimpleCache", "CACHE_DEFAULT_TIMEOUT": 300})


# JWT error handlers
@jwt.invalid_token_loader
def invalid_token_callback(error_string):
    """Handle invalid token errors."""
    current_app.logger.error(f"Invalid token error: {error_string}")
    return (
        jsonify(
            {"status": "error", "message": "Invalid token", "error": str(error_string)}
        ),
        401,
    )


@jwt.unauthorized_loader
def missing_token_callback(error_string):
    """Handle missing token errors."""
    current_app.logger.error(f"Missing token error: {error_string}")
    return (
        jsonify(
            {
                "status": "error",
                "message": "Missing authorization token",
                "error": str(error_string),
            }
        ),
        401,
    )


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    """Handle expired token errors."""
    current_app.logger.error(
        f"Expired token error - Header: {jwt_header}, Data: {jwt_data}"
    )
    return (
        jsonify(
            {
                "status": "error",
                "message": "Token has expired",
                "error": "token_expired",
            }
        ),
        401,
    )


@jwt.user_lookup_error_loader
def user_lookup_error_callback(jwt_header, jwt_data):
    """Handle user lookup errors."""
    current_app.logger.error(
        f"User lookup error - Header: {jwt_header}, Data: {jwt_data}"
    )
    return (
        jsonify(
            {"status": "error", "message": "User not found", "error": "user_not_found"}
        ),
        401,
    )


def create_socketio():
    """Create SocketIO instance."""
    _socketio = SocketIO(
        cors_allowed_origins="*",
        async_mode="threading",
        logger=False,
        engineio_logger=False,
    )
    return _socketio


socketio = create_socketio()


def ratelimit_error_handler(e):
    """Handle rate limit exceeded errors."""
    return (
        jsonify(
            {
                "status": "error",
                "message": "Rate limit exceeded. Please try again later.",
            }
        ),
        429,
    )


def exempt_test_requests():
    """Exempt test requests from rate limiting."""
    from flask import current_app

    return current_app.config.get("TESTING", False)


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["5 per minute"],  # Stricter limit for testing
    storage_uri="memory://",
)

limiter.request_filter(exempt_test_requests)


def init_extensions(app):
    """Initialize Flask extensions."""
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    migrate.init_app(app, db)
    cache.init_app(app)
    limiter.init_app(app)

    # Configure WebSocket
    socketio.init_app(
        app,
        cors_allowed_origins="*",
        async_mode="threading",
        logger=False,
        engineio_logger=False,
    )

    # Register rate limit error handler
    app.errorhandler(429)(ratelimit_error_handler)

    return None
