from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.note import Note
from ...models.character import Character
from ....extensions import db

from . import notes_bp

@notes_bp.route('/character/<int:character_id>', methods=['GET'])
@jwt_required()
def get_character_notes(character_id):
    try:
        # Get character and check access
        character = Character.query.get_or_404(character_id)
        user_id = get_jwt_identity()

        if not character.universe.is_public and character.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Get all notes for the character
        notes = Note.query.filter_by(
            character_id=character_id,
            is_deleted=False
        ).all()

        return jsonify({
            'message': 'Notes retrieved successfully',
            'notes': [note.to_dict() for note in notes]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving notes: {str(e)}")
        return jsonify({
            'message': 'Error retrieving notes',
            'error': str(e)
        }), 500 