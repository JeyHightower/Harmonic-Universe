from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Universe
from ....extensions import db

from . import universes_bp

@universes_bp.route('/<int:universe_id>', methods=['GET'])
@jwt_required()
def get_universe(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Check if user has access to this universe
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        return jsonify({
            'message': 'Universe retrieved successfully',
            'universe': universe.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Error retrieving universe',
            'error': str(e)
        }), 500 