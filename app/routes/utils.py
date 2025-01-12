from functools import wraps
from flask import session, jsonify, request, g
from app.models import User

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication Required'}), 401

        g.current_user = User.query.get(session['user_id'])
        if g.current_user is None:
            session.pop('user_id', None)
            return jsonify({'error': 'Authentication Required'}), 401
        return f(*args, **kwargs)
    return decorated_function
