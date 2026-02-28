from flask import jsonify, Blueprint, request
from flask_jwt_extended import jwt_required
from models import Character,Universe
from config import db
from sqlalchemy import select
from utils import get_current_user,add_notes_to_character, add_universes_to_character, character_with_authorization, validate_character_data, characters_with_authorization, execute_character_creation, execute_character_update


character_bp = Blueprint('characters', __name__, url_prefix='/characters')


@character_bp.route('/', methods = ['POST'])
@jwt_required()
def create_character():
    """Creates a character."""
    try:
        data = request.get_json() or {}
        if not data:
            return jsonify({
                'Error': 'Request body cannot be empty or invalid.'
            }), 400

        user = get_current_user()
        if not user:
            return jsonify({
                'Error': 'Unauthorized.'
            }),  401
        
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
@jwt_required()
def get_all_characters():
    
    user = get_current_user()
    if not user:
        return jsonify({
            'Error': 'Unauthorized.'
        }), 401
    
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
@jwt_required()
def get_character(character_id):

    user = get_current_user()
    if not user:
        return jsonify({
            'Message': 'User not found. '
        }), 404

    character = character_with_authorization(user, character_id)
    if not character:
        return jsonify({
            'Message': 'No Character found.'
        }), 404

    return jsonify({
        'Message': f'Character with id of {character_id} has been found.',
        'Character': character.to_dict()
    }), 200



@character_bp.route('/<int:character_id>', methods = ['PATCH'])
@jwt_required()
def update_character(character_id):
    data = request.get_json() or {}
    user = get_current_user()

    is_valid, error_msg = validate_character_data(data, partial=True)
    if not is_valid:
        return jsonify({
            'Error': error_msg
        }), 400

    try:
        character = character_with_authorization(user,character_id)
        if not character:
            return jsonify({
                'Message': 'Character not found.'
            }), 404
        
        execute_character_update(user, character, data)
        db.session.commit()
        return jsonify({
            'Message': 'Character updated successfully.',
            'Character': character.to_dict()
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
@jwt_required()
def delete_character(character_id):
    user = get_current_user()
    if not user:
        return jsonify({
            'Message': 'User not found.'
        }), 404

    character = character_with_authorization(user,character_id)
    if not character:
        return jsonify({
            'Message': 'Character not found.'
        }), 404
    try:
        db.session.delete(character)
        db.session.commit()

        return jsonify({
            'Message': f'Character {character_id} has been deleted successfully.'
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')
        return jsonify({
            'Message': ' Error has occured.'
        }), 500


