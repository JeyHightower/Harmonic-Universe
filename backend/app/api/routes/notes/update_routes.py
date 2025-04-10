from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.note import Note
from ....extensions import db

from . import notes_bp

@notes_bp.route('/<int:note_id>', methods=['PUT'])
@jwt_required()
def update_note(note_id):
    try:
        note = Note.query.get_or_404(note_id)
        user_id = get_jwt_identity()

        # Check if user has access to this note's universe
        if not note.universe.is_public and note.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        data = request.get_json()

        # Update note fields
        if 'title' in data:
            note.title = data['title'].strip()
        if 'content' in data:
            note.content = data['content'].strip()
        if 'tags' in data:
            note.tags = data['tags']
        if 'is_public' in data:
            note.is_public = data['is_public']
        if 'is_archived' in data:
            note.is_archived = data['is_archived']
        if 'position' in data:
            note.position_x = data['position'].get('x', note.position_x)
            note.position_y = data['position'].get('y', note.position_y)
            note.position_z = data['position'].get('z', note.position_z)

        # Validate the note
        try:
            note.validate()
        except ValueError as ve:
            return jsonify({
                'message': 'Validation error',
                'error': str(ve)
            }), 400

        db.session.commit()

        return jsonify({
            'message': 'Note updated successfully',
            'note': note.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating note: {str(e)}")
        return jsonify({
            'message': 'Error updating note',
            'error': str(e)
        }), 500 