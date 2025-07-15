from flask import request, current_app
from functools import wraps
from flask_jwt_extended import jwt_required
from flask_limiter.util import get_remote_address
from ..extensions import limiter
import re

def exempt_options_requests():
    """Decorator to exempt OPTIONS requests from rate limiting."""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if request.method == "OPTIONS":
                return f(*args, **kwargs)
            else:
                return limiter.exempt(f)(*args, **kwargs)
        return wrapped
    return decorator

def is_valid_demo_email(email):
    """Return True if the email matches the allowed demo user pattern."""
    if not email:
        return False
    # Allow demo@example.com and demo-<alphanumeric>@example.com
    return bool(re.match(r"^demo(-[a-zA-Z0-9]+)?@example.com$", email))

def get_demo_user_email():
    """Get the demo user email from the request header, fallback to demo@example.com."""
    email = request.headers.get('X-Demo-User-Email', 'demo@example.com')
    if is_valid_demo_email(email):
        return email
    return 'demo@example.com'

def jwt_required_except_options(f):
    """Decorator that applies JWT requirement except for OPTIONS requests"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
        return jwt_required()(f)(*args, **kwargs)
    return decorated_function

def jwt_required_or_demo(f):
    """Decorator that applies JWT requirement or allows demo users"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
        is_demo_user = request.headers.get('X-Demo-User') == 'true'
        if hasattr(current_app, 'logger'):
            current_app.logger.info(f'Demo user decorator: is_demo_user={is_demo_user}, headers={dict(request.headers)}')
        if is_demo_user:
            if hasattr(current_app, 'logger'):
                current_app.logger.info('Demo user detected, bypassing JWT validation')
            return f(*args, **kwargs)
        else:
            if hasattr(current_app, 'logger'):
                current_app.logger.info('Regular user detected, applying JWT validation')
            return jwt_required()(f)(*args, **kwargs)
    return decorated_function
