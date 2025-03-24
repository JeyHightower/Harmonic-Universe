from flask import Blueprint, request, jsonify
from ..models import Character
from app import db
from flask_login import login_required, current_user

characters_bp = Blueprint('characters', __name__)

# Get all characters
@characters_bp.route('/api/characters', methods=['GET'])
@login_required
def get_characters():
    universe_id = request.args.get('universe_id')
    if universe_id:
        characters = Character.query.filter_by(universe_id=universe_id).all()
    else:
        characters = Character.query.all()
    return jsonify([character.to_dict() for character in characters])

# Get a specific character
@characters_bp.route('/api/characters/<int:character_id>', methods=['GET'])
@login_required
def get_character(character_id):
    character = Character.query.get_or_404(character_id)
    return jsonify(character.to_dict())

# Create a new character
@characters_bp.route('/api/characters', methods=['POST'])
@login_required
def create_character():
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
        
    character = Character(
        name=data['name'],
        description=data.get('description', ''),
        universe_id=data.get('universe_id')
    )
    
    db.session.add(character)
    db.session.commit()
    
    return jsonify(character.to_dict()), 201

# Update a character
@characters_bp.route('/api/characters/<int:character_id>', methods=['PUT'])
@login_required
def update_character(character_id):
    character = Character.query.get_or_404(character_id)
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
@characters_bp.route('/api/characters/<int:character_id>', methods=['DELETE'])
@login_required
def delete_character(character_id):
    character = Character.query.get_or_404(character_id)
    db.session.delete(character)
    db.session.commit()
    
    return jsonify({'message': 'Character deleted successfully'})
