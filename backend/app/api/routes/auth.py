"""Authentication routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required
)
from app.db.session import get_db
from app.models.core.user import User
from app.core.errors import AuthenticationError, ValidationError
from app.core.security import get_password_hash, verify_password

auth_bp = Blueprint('auth', __name__)

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
            password_hash=get_password_hash(data['password']),
            is_active=True
        )
        user.save(db)

        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
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

        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        })

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)
    return jsonify({'access_token': access_token})

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    """Get current user info."""
    current_user_id = get_jwt_identity()
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
    data = request.get_json()

    with get_db() as db:
        user = User.get_by_id(db, current_user_id)
        if not user:
            raise AuthenticationError('User not found')

        allowed_fields = {'username', 'email', 'color'}
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        if 'email' in update_data:
            existing = db.query(User).filter_by(email=update_data['email']).first()
            if existing and existing.id != current_user_id:
                raise ValidationError('Email already registered')

        if 'username' in update_data:
            existing = db.query(User).filter_by(username=update_data['username']).first()
            if existing and existing.id != current_user_id:
                raise ValidationError('Username already taken')

        for key, value in update_data.items():
            setattr(user, key, value)
        user.save(db)

        return jsonify(user.to_dict())

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # In a real application, you might want to blacklist the token here
    return jsonify({'message': 'Successfully logged out'})
