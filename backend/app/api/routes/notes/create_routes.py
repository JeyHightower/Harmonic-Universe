from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.note import Note
from ...models.universe import Universe
from ....extensions import db

from . import notes_bp

@notes_bp.route('/', methods=['POST'])
@jwt_required()
def create_note():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'message': 'No data provided',
                'error': 'Request body is required'
            }), 400

        user_id = get_jwt_identity()
        
        # Validate required fields
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        universe_id = data.get('universe_id')
        
        if not title:
            return jsonify({
                'message': 'Title is required',
                'error': 'Note title cannot be empty'
            }), 400
            
        if not content:
            return jsonify({
                'message': 'Content is required',
                'error': 'Note content cannot be empty'
            }), 400
            
        if not universe_id:
            return jsonify({
                'message': 'Universe ID is required',
                'error': 'Note must belong to a universe'
            }), 400

        # Check if universe exists and user has access
        universe = Universe.query.get_or_404(universe_id)
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Create new note
        note = Note(
            title=title,
            content=content,
            user_id=user_id,
            universe_id=universe_id,
            scene_id=data.get('scene_id'),
            character_id=data.get('character_id'),
            tags=data.get('tags', []),
            is_public=data.get('is_public', False),
            is_archived=data.get('is_archived', False),
            position_x=data.get('position', {}).get('x', 0.0),
            position_y=data.get('position', {}).get('y', 0.0),
            position_z=data.get('position', {}).get('z', 0.0)
        )

        # Validate the note
        try:
            note.validate()
        except ValueError as ve:
            return jsonify({
                'message': 'Validation error',
                'error': str(ve)
            }), 400

        db.session.add(note)
        db.session.commit()
        
        return jsonify({
            'message': 'Note created successfully',
            'note': note.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating note: {str(e)}")
        return jsonify({
            'message': 'Error creating note',
            'error': str(e)
        }), 500 