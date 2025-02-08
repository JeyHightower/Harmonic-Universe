from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from app.models import User

def protect_demo_user():
    """Middleware to protect demo user from modifications"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)

            # Check if this is the demo user
            if user and user.email == 'demo@harmonic-universe.com':
                # List of protected routes/methods
                protected_routes = [
                    ('/api/auth/update', ['PUT', 'PATCH']),
                    ('/api/auth/password', ['PUT']),
                    ('/api/auth/delete', ['DELETE']),
                ]

                # Check if current route is protected
                for route, methods in protected_routes:
                    if request.path.startswith(route) and request.method in methods:
                        return jsonify({
                            'error': 'Demo user cannot perform this action',
                            'message': 'This feature is disabled for the demo account'
                        }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator
