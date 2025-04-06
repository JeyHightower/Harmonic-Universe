from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.api.models.note import Note
from backend.app.api.models.universe import Universe, Scene
from backend.app.api.models.character import Character
from backend.app.extensions import db

notes_bp = Blueprint('notes', __name__)

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

@notes_bp.route('/scene/<int:scene_id>', methods=['GET'])
@jwt_required()
def get_scene_notes(scene_id):
    try:
        # Get scene and check access
        scene = Scene.query.get_or_404(scene_id)
        user_id = get_jwt_identity()

        if not scene.universe.is_public and scene.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Get all notes for the scene
        notes = Note.query.filter_by(
            scene_id=scene_id,
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

@notes_bp.route('/character/<int:character_id>', methods=['GET'])
@jwt_required()
def get_character_notes(character_id):
    try:
        # Get character and check access
        character = Character.query.get_or_404(character_id)
        user_id = get_jwt_identity()

        if not character.scene.universe.is_public and character.scene.universe.user_id != user_id:
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
        return jsonify({
            'message': 'Error retrieving note',
            'error': str(e)
        }), 500

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
        return jsonify({
            'message': 'Error creating note',
            'error': str(e)
        }), 500

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
        return jsonify({
            'message': 'Error updating note',
            'error': str(e)
        }), 500

@notes_bp.route('/<int:note_id>', methods=['DELETE'])
@jwt_required()
def delete_note(note_id):
    try:
        note = Note.query.get_or_404(note_id)
        user_id = get_jwt_identity()

        # Check if user has access to this note's universe
        if not note.universe.is_public and note.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Soft delete the note
        note.is_deleted = True
        db.session.commit()

        return jsonify({
            'message': 'Note deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error deleting note',
            'error': str(e)
        }), 500

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

        note.archive()
        db.session.commit()

        return jsonify({
            'message': 'Note archived successfully',
            'note': note.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
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

        note.unarchive()
        db.session.commit()

        return jsonify({
            'message': 'Note unarchived successfully',
            'note': note.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error unarchiving note',
            'error': str(e)
        }), 500
