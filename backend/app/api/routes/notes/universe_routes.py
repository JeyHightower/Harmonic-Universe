from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.note import Note
from ...models.universe import Universe
from ....extensions import db

from . import notes_bp

@notes_bp.route('/universe/<int:universe_id>', methods=['GET'])
@jwt_required()
def get_universe_notes(universe_id):
    try:
        # Get universe and check access
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Get all notes for the universe
        notes = Note.query.filter_by(
            universe_id=universe_id,
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