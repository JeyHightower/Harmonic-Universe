from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Universe
from ....extensions import db

from . import universes_bp

@universes_bp.route('/demo-universe-1/', methods=['GET'], endpoint='get_demo_universe')
@universes_bp.route('/demo-universe-1', methods=['GET'], endpoint='get_demo_universe_no_slash')
@jwt_required()
def get_demo_universe():
    """Special handler for demo universe requests"""
    try:
        # Return the demo universe data
        demo_universe = {
            'id': 'demo-universe-1',
            'name': 'Demo Universe',
            'description': 'This is a demo universe for testing purposes',
            'user_id': 'demo-user',
            'created_at': '2025-01-01T00:00:00Z',
            'updated_at': '2025-01-01T00:00:00Z',
            'is_public': True,
            'tags': ['demo', 'test'],
            'scene_count': 5,
            'is_owner': True
        }

        return jsonify({
            'message': 'Universe retrieved successfully',
            'universe': demo_universe
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error retrieving demo universe: {str(e)}")
        return jsonify({
            'message': 'Error retrieving demo universe',
            'error': str(e)
        }), 500

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
