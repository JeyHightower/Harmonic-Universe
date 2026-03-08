from flask import jsonify, Blueprint, request
from flask_jwt_extended import jwt_required
from models import Character,Universe
from config import db
from sqlalchemy import select
from utils import get_current_user,add_notes_to_character, load_character_relationships,resource_owner_required,add_universes_to_character, characters_with_authorization, validate_character_data, execute_character_creation, execute_character_update, token_and_user_required, resource_owner_required


character_bp = Blueprint('characters', __name__, url_prefix='/characters')


@character_bp.route('/', methods = ['POST'])
@token_and_user_required
def create_character(user):
    """Creates a character."""
    try:
        data = request.get_json() or {}
        if not data:
            return jsonify({
                'Error': 'Request body cannot be empty or invalid.'
            }), 400
        
        is_valid, error_msg = validate_character_data(data)
        if not is_valid:
            return jsonify({
                'Error': error_msg
            }), 400

        new_character = execute_character_creation(user, data)
        return jsonify ({
            'Message': 'Character successfully created',
            'Character': new_character.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print (f'Error: {str(e)}')
        return jsonify({
            'Error': 'Server Error'
        }), 500

    
@character_bp.route('/', methods=['GET'])
@token_and_user_required
def get_all_characters(user):
    characters = characters_with_authorization(user)
    if not characters:
        return jsonify({
            'Message': 'No characters found.'
        }), 404
    
    return jsonify({
        'Message': 'All characters have been found',
        'Characters': [c.to_dict() for c in characters]
    }), 200
    

@character_bp.route('/<int:character_id>')
@token_and_user_required
@resource_owner_required(Character)
def get_character(user, character, *args, **kwargs):

    character_with_relationships = load_character_relationships(user, character.character_id)
    if not character_with_relationships:
        return jsonify({
            'Message': 'No Character found.'
        }), 404

    return jsonify({
        'Message': f'Character with id of {character.character_id} has been found.',
        'Character': character_with_relationships.to_dict()
    }), 200



@character_bp.route('/<int:character_id>', methods = ['PATCH'])
@token_and_user_required
@resource_owner_required(Character)
def update_character(user, character, *args, **kwargs):
    data = request.get_json() or {}

    is_valid, error_msg = validate_character_data(data, partial=True)
    if not is_valid:
        return jsonify({
            'Error': error_msg
        }), 400

    try:
        execute_character_update(user, character, data)
        db.session.commit()
        return jsonify({
            'Message': 'Character updated successfully.',
            'Character': character.to_dict(summary=True)
        }), 200
    except(PermissionError, ValueError) as e:
        db.session.rollback()
        return jsonify({
            'Error': f'{str(e)}'
        }), 400
    except Exception as e:
        db.session.rollback()
        print(f'System Error: {e}')
        return jsonify({
            'Message': 'Server Error.'
        }), 500


    
@character_bp.route('/<int:character_id>', methods = ['DELETE'])
@token_and_user_required
@resource_owner_required(Character)
def delete_character(user, character, *args, **kwargs):
    try:
        db.session.delete(character)
        db.session.commit()
        return jsonify({
            'Message': f'Character {character.character_id} has been deleted successfully.'
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')
        return jsonify({
            'Message': ' Error has occured.'
        }), 500


