from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Universe
from ....extensions import db

from . import universes_bp

@universes_bp.route('/<int:universe_id>/', methods=['GET'])
@jwt_required()
def get_universe(universe_id):
    try:
        # Get current user ID from JWT
        user_id_str = get_jwt_identity()
        if not user_id_str:
            current_app.logger.error(f"Invalid JWT token for universe {universe_id}")
            return jsonify({
                'message': 'Invalid authentication token',
                'error': 'invalid_token'
            }), 401

        # Convert user_id to integer for comparison with database
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            current_app.logger.error(f"Invalid user ID format in JWT: {user_id_str}")
            return jsonify({
                'message': 'Invalid authentication token format',
                'error': 'invalid_token'
            }), 401

        # Get universe
        universe = Universe.query.get_or_404(universe_id)

        # Check access permissions
        if not universe.is_public and universe.user_id != user_id:
            current_app.logger.warning(f"Access denied for user {user_id} to universe {universe_id}")
            return jsonify({
                'message': 'Access denied',
                'error': 'access_denied',
                'details': 'You do not have permission to access this universe'
            }), 403

        return jsonify({
            'message': 'Universe retrieved successfully',
            'universe': universe.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving universe {universe_id}: {str(e)}")
        return jsonify({
            'message': 'Error retrieving universe',
            'error': str(e)
        }), 500
