from functools import wraps
from flask import session, jsonify, request, g, current_app
from app.models.user import User
from app.config import Config
import jwt

def store_bearer_token(token):
    session['bearer_token'] = token

def get_bearer_token():
    return session.get('bearer_token')

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401

        try:
            token = auth_header.split(" ")[1]
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            user = User.query.get(data['user_id'])

            if not user:
                return jsonify({'error': 'User not found'}), 404

            g.current_user = user
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return decorated_function
