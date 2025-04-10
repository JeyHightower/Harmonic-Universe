from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.note import Note
from ....extensions import db

from . import notes_bp

@notes_bp.route('/<int:note_id>', methods=['GET'])
@jwt_required()
def get_note(note_id):
    try:
        note = Note.query.get_or_404(note_id)
        user_id = get_jwt_identity()

        # Check if user has access to this note's universe
        if not note.universe.is_public and note.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        return jsonify({
            'message': 'Note retrieved successfully',
            'note': note.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving note: {str(e)}")
        return jsonify({
            'message': 'Error retrieving note',
            'error': str(e)
        }), 500 