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
from app.schemas.user import UserSchema
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
user_schema = UserSchema()
auth_service = AuthService()

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
    data = request.get_json()

    try:
        user = auth_service.register_user(data)
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'user': user_schema.dump(user),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to register user'}), 500

@auth_bp.route('/login', methods=['POST'])
@rate_limit_if_enabled("30 per hour")
def login():
    """Login a user."""
    data = request.get_json()

    try:
        user = auth_service.authenticate_user(
            data.get('email'),
            data.get('password')
        )

        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401

        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403

        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'user': user_schema.dump(user),
            'access_token': access_token,
            'refresh_token': refresh_token
        })
    except Exception as e:
        return jsonify({'error': 'Failed to login'}), 500

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
    """Logout a user."""
    jti = get_jwt()['jti']
    try:
        auth_service.blacklist_token(jti)
        return '', 204
    except Exception as e:
        return jsonify({'error': 'Failed to logout'}), 500

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

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    current_user_id = get_jwt_identity()

    try:
        user = User.query.get(current_user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401

        access_token = create_access_token(identity=current_user_id)
        return jsonify({'access_token': access_token})
    except Exception as e:
        return jsonify({'error': 'Failed to refresh token'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def request_password_reset():
    """Request a password reset."""
    data = request.get_json()

    try:
        auth_service.request_password_reset(data.get('email'))
        return jsonify({'message': 'Password reset email sent'}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to request password reset'}), 500

@auth_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    """Reset password using token."""
    data = request.get_json()

    try:
        auth_service.reset_password(token, data.get('new_password'))
        return jsonify({'message': 'Password reset successful'}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to reset password'}), 500

@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    """Verify user's email address."""
    try:
        auth_service.verify_email(token)
        return jsonify({'message': 'Email verified successfully'}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to verify email'}), 500

@auth_bp.route('/resend-verification', methods=['POST'])
@jwt_required()
def resend_verification():
    """Resend email verification link."""
    current_user_id = get_jwt_identity()

    try:
        auth_service.resend_verification_email(current_user_id)
        return jsonify({'message': 'Verification email sent'}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to resend verification email'}), 500
