"""User management routes."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.db.session import get_db
from app.models.user import User
from app.core.errors import ValidationError, NotFoundError

users_bp = Blueprint('users', __name__)

@users_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    """Get current user profile."""
    current_user_id = get_jwt_identity()

    with get_db() as db:
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            raise NotFoundError('User not found')
        return jsonify(user.to_dict())

@users_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    """Update current user profile."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        raise ValidationError('No input data provided')

    allowed_fields = {'username', 'email'}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    with get_db() as db:
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            raise NotFoundError('User not found')

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
        db.commit()

        return jsonify(user.to_dict())

@users_bp.route('/me/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    """Update user settings."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        raise ValidationError('No input data provided')

    allowed_settings = {'theme', 'notifications', 'color'}
    settings_data = {k: v for k, v in data.items() if k in allowed_settings}

    with get_db() as db:
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            raise NotFoundError('User not found')

        # Update settings
        if 'theme' in settings_data:
            if settings_data['theme'] not in ['light', 'dark']:
                raise ValidationError('Invalid theme value')

        if 'notifications' in settings_data:
            if not isinstance(settings_data['notifications'], bool):
                raise ValidationError('Invalid notifications value')

        if 'color' in settings_data:
            if not isinstance(settings_data['color'], str) or len(settings_data['color']) != 7:
                raise ValidationError('Invalid color value')

        # Update user settings
        for key, value in settings_data.items():
            setattr(user, key, value)
        db.commit()

        return jsonify(user.to_dict())
