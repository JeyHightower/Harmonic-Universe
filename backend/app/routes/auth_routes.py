# app/routes/auth_routes.py
from flask import Blueprint, request, jsonify, g
from app.models.user import User
from app.models.universe import Universe
from app import db
import jwt
import bcrypt
from datetime import datetime, timedelta, UTC
from app.config import Config
from app.utils.token_manager import auto_token
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def generate_token(user_id):
    """Generate a JWT token for the user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.now(UTC) + timedelta(days=30),
        'iat': datetime.now(UTC)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

@auth_bp.route('/token', methods=['POST'])
def get_token():
    """Get a token with email/password"""
    data = request.get_json()

    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing email or password'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        token = generate_token(user.id)
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        })

    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/token/refresh', methods=['POST'])
def refresh_token():
    """Get a new token using an existing valid token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No token provided'}), 401

    try:
        token = auth_header.split(" ")[1]
        data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        user = User.query.get(data['user_id'])

        if not user:
            return jsonify({'error': 'User not found'}), 404

        new_token = generate_token(user.id)
        return jsonify({
            'token': new_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        })
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Create a new user account"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Request body is required'
            }), 400

        # Clean and validate input data
        email = data.get('email', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', '')

        # Validate all fields are present
        missing = []
        if not email: missing.append('email')
        if not username: missing.append('username')
        if not password: missing.append('password')

        if missing:
            return jsonify({
                'error': 'Missing required fields',
                'message': f'The following fields are required: {", ".join(missing)}'
            }), 400

        # Check if user already exists
        existing_user = User.query.filter((User.email == email) | (User.username == username)).first()
        if existing_user:
            return jsonify({
                'error': 'User already exists',
                'message': 'Email or username is already taken'
            }), 400

        # Create new user
        new_user = User(
            username=username,
            email=email
        )
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        # Generate token for new user
        token = generate_token(new_user.id)

        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': {
                'id': new_user.id,
                'email': new_user.email,
                'username': new_user.username
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Server error',
            'message': str(e)
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Request body is required'
            }), 400

        if 'email' not in data or 'password' not in data:
            return jsonify({
                'error': 'Missing credentials',
                'message': 'Both email and password are required'
            }), 400

        user = User.query.filter_by(email=data['email']).first()

        if user and bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
            token = generate_token(user.id)
            return jsonify({
                'message': 'Logged in successfully',
                'token': token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username
                }
            }), 200

        return jsonify({
            'error': 'Invalid credentials',
            'message': 'Email or password is incorrect'
        }), 401

    except Exception as e:
        return jsonify({
            'error': 'Server error',
            'message': str(e)
        }), 500

@auth_bp.route('/validate', methods=['GET'])
def validate_token():
    """Validate a token and return user info"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No token provided'}), 401

    try:
        token = auth_header.split(" ")[1]
        data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        user = User.query.get(data['user_id'])

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'valid': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        })
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

@auth_bp.route('/user', methods=['PUT'])
@auto_token
def update_user():
    """Update the authenticated user's information"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Request body is required'
            }), 400

        user = User.query.get(g.current_user.id)
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'User account not found'
            }), 404

        # Update fields if provided
        if 'username' in data:
            user.username = data['username'].strip()
        if 'email' in data:
            user.email = data['email'].strip()
        if 'password' in data:
            user.set_password(data['password'])

        db.session.commit()

        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Server error',
            'message': str(e)
        }), 500

@auth_bp.route('/user', methods=['DELETE'])
@auto_token
def delete_user():
    """Delete the authenticated user's account"""
    try:
        print("Received delete user request")  # Debug log
        user = User.query.get(g.current_user.id)
        if not user:
            return jsonify({
                'error': 'User not found',
                'type': 'not_found_error'
            }), 404

        # Delete user's universes first
        try:
            Universe.query.filter_by(creator_id=user.id).delete()
            db.session.delete(user)
            db.session.commit()

            return jsonify({
                'message': 'User account deleted successfully'
            }), 200

        except Exception as e:
            print(f"Delete user database error: {str(e)}")  # Debug log
            db.session.rollback()
            raise

    except Exception as e:
        print(f"Delete user error: {str(e)}")  # Debug log
        return jsonify({
            'error': 'An error occurred while deleting the user',
            'type': 'server_error',
            'details': str(e)
        }), 500
