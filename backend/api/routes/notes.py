from flask import Blueprint, request, jsonify
from ..models import Note
from ..database import db
from flask_login import login_required, current_user

notes_bp = Blueprint('notes', __name__)

# Get all notes
@notes_bp.route('/api/notes', methods=['GET'])
@login_required
def get_notes():
    # Filter parameters
    universe_id = request.args.get('universe_id')
    scene_id = request.args.get('scene_id')
    character_id = request.args.get('character_id')
    
    # Build query based on filters
    query = Note.query.filter_by(user_id=current_user.id)
    
    if universe_id:
        query = query.filter_by(universe_id=universe_id)
    if scene_id:
        query = query.filter_by(scene_id=scene_id)
    if character_id:
        query = query.filter_by(character_id=character_id)
        
    notes = query.all()
    return jsonify([note.to_dict() for note in notes])

# Get a specific note
@notes_bp.route('/api/notes/<int:note_id>', methods=['GET'])
@login_required
def get_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=current_user.id).first_or_404()
    return jsonify(note.to_dict())

# Create a new note
@notes_bp.route('/api/notes', methods=['POST'])
@login_required
def create_note():
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({'error': 'Content is required'}), 400
        
    note = Note(
        content=data['content'],
        universe_id=data.get('universe_id'),
        scene_id=data.get('scene_id'),
        character_id=data.get('character_id'),
        user_id=current_user.id
    )
    
    db.session.add(note)
    db.session.commit()
    
    return jsonify(note.to_dict()), 201

# Update a note
@notes_bp.route('/api/notes/<int:note_id>', methods=['PUT'])
@login_required
def update_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    
    if 'content' in data:
        note.content = data['content']
    if 'universe_id' in data:
        note.universe_id = data['universe_id']
    if 'scene_id' in data:
        note.scene_id = data['scene_id']
    if 'character_id' in data:
        note.character_id = data['character_id']
        
    db.session.commit()
    
    return jsonify(note.to_dict())

# Delete a note
@notes_bp.route('/api/notes/<int:note_id>', methods=['DELETE'])
@login_required
def delete_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=current_user.id).first_or_404()
    db.session.delete(note)
    db.session.commit()
    
    return jsonify({'message': 'Note deleted successfully'})
