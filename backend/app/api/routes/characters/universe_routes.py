from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Universe
from ...models.character import Character
from ....extensions import db

from . import characters_bp

@characters_bp.route('/universe/<int:universe_id>', methods=['GET'])
@characters_bp.route('/universe/<int:universe_id>/', methods=['GET'])
@jwt_required()
def get_characters_by_universe(universe_id):
    try:
        # Get universe and check access
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Get all characters for the universe
        characters = Character.query.filter_by(
            universe_id=universe_id,
            is_deleted=False
        ).all()

        return jsonify({
            'message': 'Characters retrieved successfully',
            'characters': [character.to_dict() for character in characters]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving universe characters: {str(e)}")
        return jsonify({
            'message': 'Error retrieving universe characters',
            'error': str(e)
        }), 500
