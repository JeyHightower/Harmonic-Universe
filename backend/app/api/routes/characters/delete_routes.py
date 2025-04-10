from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Universe
from ...models.character import Character
from ....extensions import db

from . import characters_bp

@characters_bp.route('/<int:character_id>', methods=['DELETE'])
@jwt_required()
def delete_character(character_id):
    try:
        character = Character.query.get_or_404(character_id)
        user_id = get_jwt_identity()
        
        # Get the universe for this character
        universe_id = character.universe_id
        
        # Check if the universe belongs to the user (only owner can delete)
        universe = Universe.query.get_or_404(universe_id)
        
        if universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Soft delete
        character.is_deleted = True
        db.session.commit()
        
        return jsonify({
            'message': 'Character deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting character: {str(e)}")
        return jsonify({
            'message': 'Error deleting character',
            'error': str(e)
        }), 500 