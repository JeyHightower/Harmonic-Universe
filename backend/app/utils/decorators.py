from flask import request
from functools import wraps
from flask_limiter.util import get_remote_address
from ..extensions import limiter

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
