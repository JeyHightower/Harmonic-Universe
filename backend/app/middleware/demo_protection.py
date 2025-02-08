"""Middleware to protect demo user from certain actions."""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.db.session import get_db
from app.models.core.user import User
from app.core.errors import AuthorizationError

def protect_demo_user(f):
    """Decorator to prevent demo user from performing certain actions."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()

        with get_db() as db:
            user = User.get_by_id(db, current_user_id)
            if not user:
                raise AuthorizationError('User not found')

            if user.email == 'demo@example.com':
                return jsonify({
                    'error': 'Demo user cannot perform this action'
                }), 403

        return f(*args, **kwargs)
    return decorated_function
