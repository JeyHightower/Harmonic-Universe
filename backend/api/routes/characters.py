from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from ..database import db
from ..models import Character

characters_bp = Blueprint('characters', __name__)

# Get all characters
@characters_bp.route('/', methods=['GET'])
@login_required
def get_characters():
    characters = Character.query.all()
    return jsonify([character.to_dict() for character in characters])

# Get a specific character
@characters_bp.route('/<int:id>', methods=['GET'])
@login_required
def get_character(id):
    character = Character.query.get_or_404(id)
    return jsonify(character.to_dict())

# Create a new character
@characters_bp.route('/', methods=['POST'])
@login_required
def create_character():
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('universe_id'):
        return jsonify({'error': 'Missing required fields'}), 400
        
    character = Character(
        name=data['name'],
        description=data.get('description', ''),
        universe_id=data['universe_id']
    )
    
    db.session.add(character)
    db.session.commit()
    
    return jsonify(character.to_dict()), 201

# Update a character
@characters_bp.route('/<int:id>', methods=['PUT'])
@login_required
def update_character(id):
    character = Character.query.get_or_404(id)
    data = request.get_json()
    
    if 'name' in data:
        character.name = data['name']
    if 'description' in data:
        character.description = data['description']
    if 'universe_id' in data:
        character.universe_id = data['universe_id']
        
    db.session.commit()
    
    return jsonify(character.to_dict())

# Delete a character
@characters_bp.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_character(id):
    character = Character.query.get_or_404(id)
    db.session.delete(character)
    db.session.commit()
    return '', 204
