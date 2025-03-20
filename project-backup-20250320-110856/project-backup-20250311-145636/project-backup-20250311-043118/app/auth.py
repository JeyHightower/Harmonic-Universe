import os
import jwt
import datetime
import uuid
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# JWT Token Required Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Check if Authorization header exists
        auth_header = request.headers.get('Authorization')
        if auth_header:
            # Extract token from "Bearer {token}" format
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Token is missing or invalid format'}), 401

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()

            if not current_user:
                return jsonify({'message': 'User not found'}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid'}), 401

        # Pass the current user to the route function
        return f(current_user, *args, **kwargs)

    return decorated

# User Registration
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Check if username and email already exist
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({'message': 'Username already exists'}), 409

    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'message': 'Email already exists'}), 409

    # Create new user
    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        hashed_password=generate_password_hash(data.get('password'))
    )

    # Save to database
    db.session.add(new_user)
    db.session.commit()

    # Generate token
    token = jwt.encode({
        'user_id': new_user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.config['SECRET_KEY'])

    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user': {
            'id': new_user.id,
            'username': new_user.username,
            'email': new_user.email
        }
    }), 201

# User Login
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    # Check for username or email
    username_or_email = data.get('username', '')

    # Try to find user by username or email
    user = User.query.filter_by(username=username_or_email).first() or \
           User.query.filter_by(email=username_or_email).first()

    if not user or not check_password_hash(user.hashed_password, data.get('password', '')):
        return jsonify({'message': 'Invalid credentials'}), 401

    # Generate token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.config['SECRET_KEY'])

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    })

# Demo Login
@auth_bp.route('/demo', methods=['POST'])
def demo_login():
    # Find or create demo user
    demo_user = User.query.filter_by(username='demo_user').first()

    if not demo_user:
        demo_user = User(
            username='demo_user',
            email='demo@example.com',
            hashed_password=generate_password_hash('demo123')
        )
        db.session.add(demo_user)
        db.session.commit()

    # Generate token
    token = jwt.encode({
        'user_id': demo_user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.config['SECRET_KEY'])

    return jsonify({
        'message': 'Demo login successful',
        'token': token,
        'user': {
            'id': demo_user.id,
            'username': demo_user.username,
            'email': demo_user.email
        }
    })

# Get Current User
@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    try:
        return jsonify({
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in get_current_user: {str(e)}")
        return jsonify({'message': 'An error occurred while retrieving user data'}), 500

# Logout (client-side only, just for API completeness)
@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    # JWT tokens cannot be invalidated unless using a token blacklist
    # This is just a placeholder for API completeness
    return jsonify({'message': 'Logout successful'}), 200
