from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
from flask import jsonify
from flask_socketio import SocketIO

db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
jwt = JWTManager()
socketio = SocketIO()

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
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
    strategy="fixed-window"
)

limiter.request_filter(exempt_test_requests)
