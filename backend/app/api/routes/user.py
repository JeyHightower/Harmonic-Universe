from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from ..models import User

user_bp = Blueprint('user', __name__)

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get the current user's detailed profile information."""
    try:
        current_app.logger.info('Starting user profile request')
        current_app.logger.info('Request headers: %s', dict(request.headers))
        current_app.logger.info('Authorization header: %s', request.headers.get('Authorization'))
        
        user_id = get_jwt_identity()
        current_app.logger.info(f'User ID from JWT: {user_id}')
        
        if not user_id:
            current_app.logger.error('No user ID found in JWT token')
            return jsonify({'message': 'Invalid token - no user ID found'}), 401
        
        user = User.query.get(user_id)
        current_app.logger.info(f'User found: {user is not None}')
        if user:
            current_app.logger.info(f'User details: id={user.id}, username={user.username}')
        
        if not user:
            current_app.logger.warning(f'User not found for ID: {user_id}')
            return jsonify({'message': 'User not found'}), 404
            
        # Get user data with relationships
        user_data = user.to_dict()
        current_app.logger.info('User data retrieved successfully')
        
        # Add additional profile information
        profile_data = {
            'id': user_data['id'],
            'username': user_data['username'],
            'email': user_data['email'],
            'created_at': user_data['created_at'],
            'updated_at': user_data['updated_at'],
            'version': user.version,
            'stats': user.get_stats()
        }
        
        current_app.logger.info('Profile data prepared successfully')
        current_app.logger.debug('Returning profile data: %s', profile_data)
        
        return jsonify({
            'message': 'User profile retrieved successfully',
            'profile': profile_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get user profile error: {str(e)}')
        current_app.logger.exception('Full traceback:')
        return jsonify({
            'message': 'An error occurred while fetching user profile',
            'error': str(e)
        }), 500 