from flask import jsonify, Blueprint, request
from models import Character, db, Universe
from sqlalchemy import select


character_bp = Blueprint('characters', __name__, url_prefix='/characters')

#! HELPER FUNCTIONS

def get_current_user():
    """Retrieves the current user."""
    user_id = session.get('user_id')
    if not user_id:
        return None
    return db.session.get(User, user_id)

def get_owned_universe_ids(user):
    """Returns set of universe IDs owned by the user."""
    if not user or not hasattr(user, 'owned_universes'):
        return set ()
    return set (u.universe_id for u in user.owned_universes)

def get_request_universe_ids():
    """Returns list of universe IDs in the request"""
    data = request.json
    if not data:
        return []
    return data.get('universe_ids', [])
    

@character_bp.route('/', methods = ['POST'])
def create_character():
    """Creates a character."""
    try:
        data = request.json
        user = get_current_user()

        if not data:
            return jsonify({
                'Message': 'Data is needed'
            }), 400

        if not user:
            return jsonify({
                'Message': 'User is required to create a character'
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
            owner_id = user.user_id
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
    
    characters = user.created_characters
    if not characters:
        return jsonify({
            'Message': 'No characters found.'
        }), 404
    
    return jsonify({
        'Message': 'All characters have been found',
        'Characters': [c.to_dict() for c in characters]
    }), 200
    

    
