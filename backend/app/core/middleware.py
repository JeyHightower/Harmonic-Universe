"""
Middleware for global error handling and request processing.
"""

from functools import wraps
from flask import request, g, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from backend.app.models.user import User
from backend.app.core.errors import AuthenticationError
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
            headers.append(("X-Request-ID", str(uuid.uuid4())))
            return start_response(status, headers, exc_info)

        return self.app(environ, custom_start_response)


def setup_middleware(app):
    """Setup middleware for the application."""

    @app.before_request
    def before_request():
        g.request_id = str(uuid.uuid4())
        g.request_start_time = time.time()

    @app.after_request
    def after_request(response):
        # Add request ID to response headers
        response.headers["X-Request-ID"] = g.get("request_id", "")

        # Calculate and add response time
        if hasattr(g, "request_start_time"):
            response_time = time.time() - g.request_start_time
            response.headers["X-Response-Time"] = f"{response_time:.3f}s"

        return response

    # Register middleware
    app.wsgi_app = RequestMiddleware(app.wsgi_app)

    return app
