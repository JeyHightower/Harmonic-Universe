"""
Middleware for global error handling and request processing.
"""

from functools import wraps
from flask import request, g, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.core.user import User
import time
import uuid

def load_user():
    """Load user from JWT token and store in g."""
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            raise AuthenticationError("User not found")
        g.current_user = user
    except Exception as e:
        g.current_user = None
        raise AuthenticationError(str(e))

def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        load_user()
        return f(*args, **kwargs)
    return decorated

def require_admin(f):
    """Decorator to require admin role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        load_user()
        if not g.current_user.is_admin:
            raise AuthorizationError("Admin access required")
        return f(*args, **kwargs)
    return decorated

class RequestMiddleware:
    """Middleware for request processing."""

    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        def custom_start_response(status, headers, exc_info=None):
            # Add custom headers
            headers.append(('X-Request-ID', str(uuid.uuid4())))
            return start_response(status, headers, exc_info)

        return self.app(environ, custom_start_response)

def setup_middleware(app):
    """Setup middleware for the Flask app."""

    @app.before_request
    def before_request():
        # Set request ID and start time
        g.request_id = str(uuid.uuid4())
        request._start_time = time.time()

        # Log request
        current_app.logger.info(f"Request {g.request_id}: {request.method} {request.path}")

        # Handle CORS preflight requests
        if request.method == 'OPTIONS':
            headers = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '3600'
            }
            return '', 204, headers

    @app.after_request
    def after_request(response):
        # Add CORS headers
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'

        # Log response
        duration = time.time() - request._start_time
        current_app.logger.info(
            f"Request {g.request_id} completed: {response.status_code} ({duration:.2f}s)"
        )

        return response

    # Register middleware
    app.wsgi_app = RequestMiddleware(app.wsgi_app)

    return app
