from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.note import Note
from ....extensions import db

from . import notes_bp

@notes_bp.route('/<int:note_id>/archive', methods=['POST'])
@jwt_required()
def archive_note(note_id):
    try:
        note = Note.query.get_or_404(note_id)
        user_id = get_jwt_identity()

        # Check if user has access to this note's universe
        if not note.universe.is_public and note.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        note.is_archived = True
        db.session.commit()

        return jsonify({
            'message': 'Note archived successfully',
            'note': note.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error archiving note: {str(e)}")
        return jsonify({
            'message': 'Error archiving note',
            'error': str(e)
        }), 500

@notes_bp.route('/<int:note_id>/unarchive', methods=['POST'])
@jwt_required()
def unarchive_note(note_id):
    try:
        note = Note.query.get_or_404(note_id)
        user_id = get_jwt_identity()

        # Check if user has access to this note's universe
        if not note.universe.is_public and note.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        note.is_archived = False
        db.session.commit()

        return jsonify({
            'message': 'Note unarchived successfully',
            'note': note.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error unarchiving note: {str(e)}")
        return jsonify({
            'message': 'Error unarchiving note',
            'error': str(e)
        }), 500 