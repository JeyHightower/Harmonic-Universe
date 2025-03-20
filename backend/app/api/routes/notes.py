from flask import Blueprint, request, jsonify
from app import db
from app.api.models.note import Note
from app.api.models.character import Character

notes_bp = Blueprint('notes', __name__, url_prefix='/api/notes')

@notes_bp.route('', methods=['GET'])
def get_notes():
    character_id = request.args.get('character_id', type=int)
    if character_id:
        notes = Note.query.filter_by(character_id=character_id).all()
    else:
        notes = Note.query.all()
    return jsonify([note.to_dict() for note in notes])

@notes_bp.route('/<int:id>', methods=['GET'])
def get_note(id):
    note = Note.query.get_or_404(id)
    return jsonify(note.to_dict())

@notes_bp.route('', methods=['POST'])
def create_note():
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({'error': 'Content is required'}), 400
    if not data.get('character_id'):
        return jsonify({'error': 'Character ID is required'}), 400
        
    # Verify character exists
    character = Character.query.get_or_404(data['character_id'])
    
    note = Note(
        content=data['content'],
        character_id=data['character_id']
    )
    
    db.session.add(note)
    db.session.commit()
    
    return jsonify(note.to_dict()), 201

@notes_bp.route('/<int:id>', methods=['PUT'])
def update_note(id):
    note = Note.query.get_or_404(id)
    data = request.get_json()
    
    if 'content' in data:
        note.content = data['content']
    if 'character_id' in data:
        # Verify new character exists
        Character.query.get_or_404(data['character_id'])
        note.character_id = data['character_id']
        
    db.session.commit()
    
    return jsonify(note.to_dict())

@notes_bp.route('/<int:id>', methods=['DELETE'])
def delete_note(id):
    note = Note.query.get_or_404(id)
    db.session.delete(note)
    db.session.commit()
    
    return '', 204 