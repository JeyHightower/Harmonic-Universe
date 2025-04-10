from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Universe
from ...models.character import Character
from ....extensions import db

from . import characters_bp

@characters_bp.route('/<int:character_id>', methods=['PUT'])
@jwt_required()
def update_character(character_id):
    try:
        character = Character.query.get_or_404(character_id)
        user_id = get_jwt_identity()

        # Get the universe for this character
        universe_id = character.universe_id
        
        # Check if the universe is public or belongs to the user
        universe = Universe.query.get_or_404(universe_id)
        
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        data = request.get_json()

        # Update character fields
        if 'name' in data:
            character.name = data['name'].strip()
        if 'description' in data:
            character.description = data['description'].strip()

        # Validate the character
        try:
            character.validate()
        except ValueError as ve:
            return jsonify({
                'message': 'Validation error',
                'error': str(ve)
            }), 400

        db.session.commit()

        return jsonify({
            'message': 'Character updated successfully',
            'character': character.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating character: {str(e)}")
        return jsonify({
            'message': 'Error updating character',
            'error': str(e)
        }), 500 