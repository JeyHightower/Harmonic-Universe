"""Authentication routes."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager, get_jwt
from flask_jwt_extended.exceptions import (
    JWTExtendedException,
    NoAuthorizationError,
    InvalidHeaderError,
    CSRFError,
    WrongTokenError,
    RevokedTokenError,
    FreshTokenRequired,
    UserLookupError
)
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import User
from app.utils.auth import require_auth, check_universe_access
from app.utils.validation import validate_registration, validate_login
from app.extensions import db, limiter, jwt
import logging
from functools import wraps

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def rate_limit_if_enabled(limit_string):
    """Conditionally apply rate limiting based on config."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if current_app.config.get('RATELIMIT_ENABLED', True):
                return limiter.limit(limit_string)(f)(*args, **kwargs)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@auth_bp.route('/register', methods=['POST'])
@rate_limit_if_enabled("30 per hour")
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        # Check if required fields are present
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'{field.capitalize()} is required'
                }), 400

        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({
                'status': 'error',
                'message': 'Email already registered'
            }), 400

        if User.query.filter_by(username=data['username']).first():
            return jsonify({
                'status': 'error',
                'message': 'Username already taken'
            }), 400

        # Validate registration data
        validation_error = validate_registration(data)
        if validation_error:
            return jsonify({
                'status': 'error',
                'message': validation_error
            }), 400

        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            password=data['password']
        )
        db.session.add(user)
        db.session.commit()

        # Generate access token
        access_token = create_access_token(identity=user.id)

        return jsonify({
            'status': 'success',
            'message': 'Registration successful',
            'data': {
                'token': access_token,
                'user': user.to_dict()
            }
        }), 201

    except Exception as e:
        current_app.logger.error(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'An error occurred during registration'
        }), 500

@auth_bp.route('/login', methods=['POST'])
@rate_limit_if_enabled("30 per hour")
def login():
    """Login user and return access token."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        # Validate login data
        validation_error = validate_login(data)
        if validation_error:
            return jsonify({
                'status': 'error',
                'message': validation_error
            }), 400

        # Find user by email
        user = User.query.filter_by(email=data['email']).first()

        # Verify password
        if not user or not user.verify_password(data['password']):
            return jsonify({
                'status': 'error',
                'message': 'Invalid email or password'
            }), 401

        # Generate access token
        access_token = create_access_token(identity=user.id)

        return jsonify({
            'status': 'success',
            'message': 'Login successful',
            'data': {
                'token': access_token,
                'user': user.to_dict()
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred during login'
        }), 500

@auth_bp.route('/validate', methods=['GET'])
@jwt_required()
def validate_token():
    """Validate a JWT token."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 404

        return jsonify({
            'status': 'success',
            'data': {
                'user': user.to_dict()
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Token validation error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred during token validation'
        }), 500

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    """Protected route for testing."""
    try:
        return jsonify({
            'status': 'success',
            'message': 'Access granted'
        }), 200
    except Exception as e:
        current_app.logger.error(f"Protected route error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred accessing protected route'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        return jsonify({
            'status': 'success',
            'message': 'Successfully logged out'
        }), 200
    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred during logout'
        }), 500

@auth_bp.route('/me', methods=['GET'])
@require_auth
@limiter.limit("30 per minute")
def get_current_user():
    """Get current user details."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 404

        return jsonify({
            'status': 'success',
            'data': {
                'user': user.to_dict()
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Get current user error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An error occurred getting user details'
        }), 500

@auth_bp.route('/me', methods=['PUT'])
@require_auth
def update_current_user():
    """Update current user details."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 404

        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        allowed_fields = ['username', 'email', 'password']
        updates = {k: v for k, v in data.items() if k in allowed_fields}

        if 'password' in updates:
            user.password = updates.pop('password')

        for key, value in updates.items():
            setattr(user, key, value)

        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'User updated successfully',
            'data': {
                'user': user.to_dict()
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Update user error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'An error occurred updating user details'
        }), 500
