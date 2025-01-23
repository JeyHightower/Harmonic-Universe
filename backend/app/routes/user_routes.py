from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, db
from ..utils.auth import check_user_access
from ..extensions import limiter

user_bp = Blueprint('user', __name__, url_prefix='/api/users')

@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get user profile"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify(user.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user profile"""
    try:
        current_user_id = get_jwt_identity()
        if not check_user_access(user_id, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No update data provided'}), 400

        # Update allowed fields
        if 'username' in data:
            user.username = data['username']
        if 'email' in data:
            user.email = data['email']
        if 'bio' in data:
            user.bio = data['bio']
        if 'preferences' in data:
            user.preferences = data['preferences']

        db.session.commit()
        return jsonify(user.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete user account"""
    try:
        current_user_id = get_jwt_identity()
        if not check_user_access(user_id, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Delete associated data
        db.session.delete(user)
        db.session.commit()

        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/search', methods=['GET'])
@jwt_required()
@limiter.limit("30 per minute")
def search_users():
    """Search users by username or email"""
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({'error': 'Search query required'}), 400

        users = User.query.filter(
            (User.username.ilike(f'%{query}%')) |
            (User.email.ilike(f'%{query}%'))
        ).limit(20).all()

        return jsonify([user.to_dict() for user in users]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/batch', methods=['POST'])
@jwt_required()
def get_users_batch():
    """Get multiple users by IDs"""
    try:
        data = request.get_json()
        if not data or 'userIds' not in data:
            return jsonify({'error': 'User IDs required'}), 400

        users = User.query.filter(User.id.in_(data['userIds'])).all()
        return jsonify([user.to_dict() for user in users]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
