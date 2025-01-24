"""User routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.schemas.user import UserSchema
from app.services.user_service import UserService

user_bp = Blueprint('users', __name__)
user_schema = UserSchema()
user_service = UserService()

@user_bp.route('/api/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get the current user's profile."""
    current_user_id = get_jwt_identity()

    try:
        user = user_service.get_user(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user_schema.dump(user))
    except Exception as e:
        return jsonify({'error': 'Failed to fetch user profile'}), 500

@user_bp.route('/api/users/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update the current user's profile."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        user = user_service.update_user(current_user_id, data)
        return jsonify(user_schema.dump(user))
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to update user profile'}), 500

@user_bp.route('/api/users/me/password', methods=['PUT'])
@jwt_required()
def update_password():
    """Update the current user's password."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        user_service.update_password(
            current_user_id,
            data.get('current_password'),
            data.get('new_password')
        )
        return '', 204
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to update password'}), 500

@user_bp.route('/api/users/me/settings', methods=['GET'])
@jwt_required()
def get_user_settings():
    """Get the current user's settings."""
    current_user_id = get_jwt_identity()

    try:
        settings = user_service.get_user_settings(current_user_id)
        return jsonify(settings)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch user settings'}), 500

@user_bp.route('/api/users/me/settings', methods=['PUT'])
@jwt_required()
def update_user_settings():
    """Update the current user's settings."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        settings = user_service.update_user_settings(current_user_id, data)
        return jsonify(settings)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to update user settings'}), 500

@user_bp.route('/api/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get a specific user's public profile."""
    try:
        user = user_service.get_user(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user_schema.dump(user))
    except Exception as e:
        return jsonify({'error': 'Failed to fetch user profile'}), 500

@user_bp.route('/api/users/search', methods=['GET'])
@jwt_required()
def search_users():
    """Search for users by username."""
    query = request.args.get('q', '')

    try:
        users = user_service.search_users(query)
        return jsonify([user_schema.dump(u) for u in users])
    except Exception as e:
        return jsonify({'error': 'Failed to search users'}), 500

@user_bp.route('/api/users/me/universes', methods=['GET'])
@jwt_required()
def get_user_universes():
    """Get all universes created by the current user."""
    current_user_id = get_jwt_identity()

    try:
        universes = user_service.get_user_universes(current_user_id)
        return jsonify(universes)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch user universes'}), 500

@user_bp.route('/api/users/me/collaborations', methods=['GET'])
@jwt_required()
def get_user_collaborations():
    """Get all universes the current user is collaborating on."""
    current_user_id = get_jwt_identity()

    try:
        collaborations = user_service.get_user_collaborations(current_user_id)
        return jsonify(collaborations)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch user collaborations'}), 500

@user_bp.route('/api/users/me/favorites', methods=['GET'])
@jwt_required()
def get_user_favorites():
    """Get all universes favorited by the current user."""
    current_user_id = get_jwt_identity()

    try:
        favorites = user_service.get_user_favorites(current_user_id)
        return jsonify(favorites)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch user favorites'}), 500
