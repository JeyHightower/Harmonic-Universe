from functools import wraps
from flask import session, jsonify, request, g, current_app
from app.models.user import User
import jwt

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print("Debug - Headers:", dict(request.headers))  # Debug print

        # First try token authentication
        auth_header = request.headers.get('Authorization')
        print("Debug - Auth header:", auth_header)  # Debug print

        if auth_header and auth_header.startswith('Bearer '):
            try:
                token = auth_header.split(" ")[1]
                print("Debug - Token:", token)  # Debug print
                # Using the same simple secret key for development
                data = jwt.decode(token, 'dev-secret-key', algorithms=["HS256"])
                print("Debug - Decoded data:", data)  # Debug print
                g.current_user = User.query.get(data['user_id'])
                if g.current_user is None:
                    print("Debug - User not found")  # Debug print
                    return jsonify({'error': 'Authentication Required'}), 401
                return f(*args, **kwargs)
            except jwt.ExpiredSignatureError:
                print("Debug - Token expired")  # Debug print
                return jsonify({'error': 'Token has expired'}), 401
            except jwt.InvalidTokenError as e:
                print("Debug - Invalid token:", str(e))  # Debug print
                return jsonify({'error': 'Invalid token'}), 401
            except Exception as e:
                print("Debug - Unexpected error:", str(e))  # Debug print
                return jsonify({'error': 'Authentication error'}), 401

        # If no token or token auth failed, try session authentication
        print("Debug - Falling back to session auth")  # Debug print
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication Required'}), 401

        g.current_user = User.query.get(session['user_id'])
        if g.current_user is None:
            session.pop('user_id', None)
            return jsonify({'error': 'Authentication Required'}), 401

        return f(*args, **kwargs)
    return decorated_function

def store_bearer_token(token):
    session['bearer_token'] = token

def get_bearer_token():
    return session.get('bearer_token')

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_bearer_token()
        if not token:
            return jsonify({'error': 'Authentication Required'}), 401

        request.headers['Authorization'] = f'Bearer {token}'
        return f(*args, **kwargs)
    return decorated_function
