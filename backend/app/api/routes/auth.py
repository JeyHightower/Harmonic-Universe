"""Authentication routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
    get_jwt
)
from datetime import timedelta
from app.db.session import get_db
from app.models.user import User
from app.core.errors import AuthenticationError, ValidationError
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token
)
from app.core.config import settings
import logging

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()

    if not all(k in data for k in ('email', 'password', 'username')):
        raise ValidationError('Missing required fields')

    with get_db() as db:
        if db.query(User).filter_by(email=data['email']).first():
            raise ValidationError('Email already registered')
        if db.query(User).filter_by(username=data['username']).first():
            raise ValidationError('Username already taken')

        user = User(
            email=data['email'],
            username=data['username'],
            password=data['password'],
            is_active=True
        )
        user.save(db)

        access_token = create_access_token(
            subject=str(user.id),
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = create_refresh_token(
            subject=str(user.id),
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )

        return jsonify({
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer'
        }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user."""
    data = request.get_json()

    if not all(k in data for k in ('email', 'password')):
        raise ValidationError('Missing required fields')

    with get_db() as db:
        user = db.query(User).filter_by(email=data['email']).first()
        if not user or not verify_password(data['password'], user.password_hash):
            raise AuthenticationError('Invalid email or password')

        if not user.is_active:
            raise AuthenticationError('User account is inactive')

        access_token = create_access_token(
            subject=str(user.id),
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = create_refresh_token(
            subject=str(user.id),
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )

        return jsonify({
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer'
        })

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    try:
        current_user_id = get_jwt_identity()
        token = get_jwt()

        # Verify token type
        if token.get('type') != 'refresh':
            raise AuthenticationError('Invalid token type')

        with get_db() as db:
            user = User.get_by_id(db, current_user_id)
            if not user or not user.is_active:
                raise AuthenticationError('User not found or inactive')

            access_token = create_access_token(
                subject=str(user.id),
                expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            )

            return jsonify({
                'access_token': access_token,
                'token_type': 'bearer'
            })
    except Exception as e:
        raise AuthenticationError(f'Token refresh failed: {str(e)}')

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    """Get current user info."""
    current_user_id = get_jwt_identity()
    token = get_jwt()

    # Verify token type
    if token.get('type') != 'access':
        raise AuthenticationError('Invalid token type')

    with get_db() as db:
        user = User.get_by_id(db, current_user_id)
        if not user:
            raise AuthenticationError('User not found')
        return jsonify(user.to_dict())

@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    """Update current user info."""
    current_user_id = get_jwt_identity()
    token = get_jwt()

    # Verify token type
    if token.get('type') != 'access':
        raise AuthenticationError('Invalid token type')

    data = request.get_json()
    allowed_fields = {'username', 'email'}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    with get_db() as db:
        user = User.get_by_id(db, current_user_id)
        if not user:
            raise AuthenticationError('User not found')

        # Check unique constraints
        if 'email' in update_data:
            existing = db.query(User).filter_by(email=update_data['email']).first()
            if existing and existing.id != current_user_id:
                raise ValidationError('Email already registered')

        if 'username' in update_data:
            existing = db.query(User).filter_by(username=update_data['username']).first()
            if existing and existing.id != current_user_id:
                raise ValidationError('Username already taken')

        # Update user
        for key, value in update_data.items():
            setattr(user, key, value)
        user.save(db)

        return jsonify(user.to_dict())

@auth_bp.route('/logout', methods=['POST'])
@jwt_required(optional=True)  # Make token optional
def logout():
    """Logout user and invalidate tokens."""
    try:
        # Get the JWT ID if available
        jwt_data = get_jwt()
        if jwt_data:
            jti = jwt_data.get("jti")
            # Here you would typically add the token to a blocklist
            # For now, we'll just return success

        return jsonify({
            'message': 'Successfully logged out',
            'status': 'success'
        }), 200
    except Exception as e:
        # Log the error but still return success
        print(f"Logout error: {str(e)}")
        return jsonify({
            'message': 'Successfully logged out',
            'status': 'success'
        }), 200  # Always return success for logout

@auth_bp.route('/demo-login', methods=['POST'])
def demo_login():
    """Login as demo user."""
    try:
        with get_db() as db:
            demo_user = db.query(User).filter_by(email='demo@example.com').first()
            if not demo_user:
                raise AuthenticationError('Demo user not found')

            if not demo_user.is_active:
                raise AuthenticationError('Demo user account is inactive')

            access_token = create_access_token(
                subject=str(demo_user.id),
                expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            )
            refresh_token = create_refresh_token(
                subject=str(demo_user.id),
                expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            )

            return jsonify({
                'user': demo_user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'bearer'
            })
    except Exception as e:
        logger.error(f"Demo login error: {str(e)}", exc_info=True)
        raise
