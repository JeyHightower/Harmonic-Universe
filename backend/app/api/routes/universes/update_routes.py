from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Universe
from ....extensions import db

from . import universes_bp

@universes_bp.route('/<int:universe_id>', methods=['PUT'])
@universes_bp.route('/<int:universe_id>/', methods=['PUT'])
@jwt_required()
def update_universe(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Convert user_id and universe.user_id to integers for consistent comparison
        try:
            # Ensure both user IDs are treated as integers for comparison
            jwt_user_id = int(user_id) if user_id is not None else None
            universe_user_id = int(universe.user_id) if universe.user_id is not None else None

            current_app.logger.info(f"UPDATE UNIVERSE: JWT user_id={jwt_user_id} (type {type(jwt_user_id).__name__}), Universe user_id={universe_user_id} (type {type(universe_user_id).__name__})")

            # Check if user owns this universe
            if jwt_user_id != universe_user_id:
                current_app.logger.warning(f"Access denied: User {jwt_user_id} attempted to update universe {universe_id} owned by {universe_user_id}")
                return jsonify({
                    'message': 'Access denied',
                    'error': 'You do not have permission to update this universe'
                }), 403

            data = request.get_json()

            # Update universe fields
            if 'name' in data:
                universe.name = data['name']
            if 'description' in data:
                universe.description = data['description']
            if 'is_public' in data:
                universe.is_public = data['is_public']

            db.session.commit()
            current_app.logger.info(f"Universe {universe_id} updated successfully")

            return jsonify({
                'message': 'Universe updated successfully',
                'universe': universe.to_dict()
            }), 200

        except ValueError as e:
            current_app.logger.error(f"Type conversion error: {str(e)}")
            return jsonify({
                'message': 'Access denied due to ID type mismatch',
                'error': str(e)
            }), 403

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating universe {universe_id}: {str(e)}")

        return jsonify({
            'message': 'Error updating universe',
            'error': str(e)
        }), 500
