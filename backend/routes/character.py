from flask import jsonify, Blueprint, request
from models import Character, db, Universe
from sqlalchemy import select
from utils import get_current_user, get_owned_universe_ids, get_request_universe_ids, character_autherization


character_bp = Blueprint('characters', __name__, url_prefix='/characters')


@character_bp.route('/', methods = ['POST'])
def create_character():
    """Creates a character."""
    try:
        data = request.json
        user = get_current_user()

        if not data:
            return jsonify({
                'Message': 'Request body cannot be empty or invalid.'
            }), 400

        if not user:
            return jsonify({
                'Message': 'Authentication required.'
            }),  401

        owned_ids = get_owned_universe_ids(user)
        request_ids = get_request_universe_ids()

        invalid_ids = [uid for uid in request_ids if  uid not in owned_ids] 
        if invalid_ids:
            return jsonify({
                'Message': f'Unauthorized Universe:{invalid_ids}' 
                })
        
        new_character = Character(
            name = data.get('name'),
            age = data.get('age'), 
            origin = data.get('origin'),
            main_power_set = data.get('main_power_set'),
            secondary_power_set = data.get('secondary_power_set'),
            skills = data.get('skills', []),
            user_id = user.user_id
        )

        for uid in request_ids:
            universe = next((u for u in user.owned_universes if u.universe_id == uid), None)
            if universe:
                new_character.universes.append(universe)

        db.session.add(new_character)
        db.session.commit()

        return jsonify ({
            'Message': 'Character successfully created',
            'Character': new_character.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print (f'Error: str{e}')
        return jsonify({
            'Message': 'Server Error'
        }), 500

    
@character_bp.route('/', methods=['GET'])
def get_all_characters():
    
    user = get_current_user()
    if not user:
        return jsonify({
            'Message': 'User not found.'
        }), 404
    
    query = select(Character). where(Character.user_id == user.user_id)
    characters = db.session.execute(query).scalars().all()
    if not characters:
        return jsonify({
            'Message': 'No characters found.'
        }), 404
    
    return jsonify({
        'Message': 'All characters have been found',
        'Characters': [c.to_dict() for c in characters]
    }), 200
    

@character_bp.route('/<int:character_id>')
def get_character(character_id):
    user = get_current_user()

    if not user:
        return jsonify({
            'Message': 'Authentication required. '
        }), 401
    
    query = select(Character).where(
        Character.character_id == character_id,
        Character.user_id == user.user_id
        )
    character = db.session.execute(query).scalars().first()

    if not character:
        return jsonify({
            'Message': 'Character not found.'
        }), 404

    return jsonify({
        'Message': f'Character with id of {character_id} has been found.',
        'Character': character.to_dict()
    }), 200



@character_bp.route('/<int:character_id>', methods = ['PUT'])
def update_character(character_id):
    try:
        data = request.json
        user = get_current_user()

        if not user:
            return jsonify ({
                'Message': 'Authentication required.'
            }), 401

        character = character_autherization(character_id)

        if not character:
            return jsonify({
                'Message': 'Character not found.'
            }), 404

        character.name = data.get('name', character.name)
        character.age = data.get('age', character.age)
        character.origin = data.get('origin', character.origin)
        character.main_power_set = data.get('main_power_set', character.main_power_set)
        character.secondary_power_set = data.get('secondary_power_set', character.secondary_power_set)
        character.skills = data.get('skills', character.skills)

        if 'universe_ids' in data:
            character.universes.clear()
            owned_universes = user.owned_universes
            owned_universe_ids = {u.universe_id for u in owned_universes}
            for uid in data['universe_ids']:
                if uid in owned_universe_ids:
                    universe = next((u for u in user.owned_universes if u.universe_id == uid), None)
                    if universe:
                        character.universes.append(universe)

        db.session.commit()

        return jsonify({
            'Message': 'Character has been successfully updated.',
            'Character': character.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')
        return jsonify({
            'Message': 'Server Error'
        }), 500

    
@character_bp.route('/<int:character_id>', methods = ['DELETE'])
def delete_character(character_id):
    user = get_current_user()
    if not user:
        return jsonify({
            'Message': 'Unauthorized.'
        }), 401

    character = character_autherization(character_id)
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
