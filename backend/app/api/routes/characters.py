from flask import Blueprint, request, jsonify
<<<<<<< HEAD
from app import db
from app.api.models.character import Character

characters_bp = Blueprint('characters', __name__, url_prefix='/api/characters')

@characters_bp.route('', methods=['GET'])
def get_characters():
    characters = Character.query.all()
    return jsonify([character.to_dict() for character in characters])

@characters_bp.route('/<int:id>', methods=['GET'])
def get_character(id):
    character = Character.query.get_or_404(id)
    return jsonify(character.to_dict())

@characters_bp.route('', methods=['POST'])
def create_character():
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
        
    character = Character(
        name=data['name'],
        description=data.get('description', '')
=======
from ..models import db, Character
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
    
    if not data.get('name') or not data.get('universe_id'):
        return jsonify({'error': 'Name and universe_id are required'}), 400
        
    character = Character(
        name=data['name'],
        description=data.get('description', ''),
        universe_id=data['universe_id']
>>>>>>> origin/main
    )
    
    db.session.add(character)
    db.session.commit()
    
    return jsonify(character.to_dict()), 201

<<<<<<< HEAD
@characters_bp.route('/<int:id>', methods=['PUT'])
def update_character(id):
    character = Character.query.get_or_404(id)
=======
# Update a character
@characters_bp.route('/api/characters/<int:character_id>', methods=['PUT'])
@login_required
def update_character(character_id):
    character = Character.query.get_or_404(character_id)
>>>>>>> origin/main
    data = request.get_json()
    
    if 'name' in data:
        character.name = data['name']
    if 'description' in data:
        character.description = data['description']
<<<<<<< HEAD
=======
    if 'universe_id' in data:
        character.universe_id = data['universe_id']
>>>>>>> origin/main
        
    db.session.commit()
    
    return jsonify(character.to_dict())

<<<<<<< HEAD
@characters_bp.route('/<int:id>', methods=['DELETE'])
def delete_character(id):
    character = Character.query.get_or_404(id)
    db.session.delete(character)
    db.session.commit()
    
    return '', 204 
=======
# Delete a character
@characters_bp.route('/api/characters/<int:character_id>', methods=['DELETE'])
@login_required
def delete_character(character_id):
    character = Character.query.get_or_404(character_id)
    db.session.delete(character)
    db.session.commit()
    
    return jsonify({'message': 'Character deleted successfully'}) 
>>>>>>> origin/main
