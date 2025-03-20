from flask import Blueprint, request, jsonify
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
    )
    
    db.session.add(character)
    db.session.commit()
    
    return jsonify(character.to_dict()), 201

@characters_bp.route('/<int:id>', methods=['PUT'])
def update_character(id):
    character = Character.query.get_or_404(id)
    data = request.get_json()
    
    if 'name' in data:
        character.name = data['name']
    if 'description' in data:
        character.description = data['description']
        
    db.session.commit()
    
    return jsonify(character.to_dict())

@characters_bp.route('/<int:id>', methods=['DELETE'])
def delete_character(id):
    character = Character.query.get_or_404(id)
    db.session.delete(character)
    db.session.commit()
    
    return '', 204 