# app/routes/auth_routes.py
from flask import Blueprint, request, jsonify, g
from app.models.user import User
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
    data = request.get_json()

    if not data or 'email' not in data or 'password' not in data or 'username' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 400

    new_user = User(
        username=data['username'],
        email=data['email']
    )
    new_user.set_password(data['password'])

    try:
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
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing email or password'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        # Generate token
        token = generate_token(user.id)

        return jsonify({
            'message': 'Logged in successfully',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        })

    return jsonify({'error': 'Invalid credentials'}), 401

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
