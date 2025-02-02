"""
User routes.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.db import db
from app.models.user import User
from app.schemas.user import user_schema, UserUpdate

users_bp = Blueprint('users', __name__, url_prefix='/users')

@users_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users."""
    try:
        users = User.query.all()
        return jsonify([user.dict() for user in users]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@users_bp.route('/<uuid:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get user by ID."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user_schema.dump(user)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@users_bp.route('/<uuid:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user."""
    try:
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check if current user is the target user
        current_user_id = get_jwt_identity()
        if str(user_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        # Validate and update user data
        data = UserUpdate(**request.json)
        data_dict = data.dict()
        for key, value in data_dict.items():
            setattr(user, key, value)
        db.session.commit()

        return jsonify(user_schema.dump(user)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@users_bp.route('/<uuid:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete user."""
    try:
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check if current user is the target user
        current_user_id = get_jwt_identity()
        if str(user_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        # Delete user
        db.session.delete(user)
        db.session.commit()

        return jsonify({'message': 'User deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
