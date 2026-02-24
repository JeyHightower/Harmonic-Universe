from flask import session, request, abort
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import select
from models import User, Character, Universe, TokenBlocklist
from config import  jwt, db


def get_current_user():
    """Retrieves the current user."""
    user_id = get_jwt_identity()
    if user_id is None:
        return None
    try:
        user_id = int(user_id)
    except(ValueError, TypeError):
        return None
    return  db.session.get(User, user_id)



def add_universes_to_character(universe_ids, user, character):
    uids = set(universe_ids)
    query = select(Universe).where(
        Universe.owner_id == user.user_id,
        Universe.universe_id.in_(uids)
    )
    valid_universes = db.session.execute(query).scalars().all()
    if len(valid_universes) != len(uids):
        raise PermissionError(
            'You do not have permission to access one or more of the Universes.'
            )
    character.universes = valid_universes

def add_characters_to_universe(character_ids, user, universe):
    cids = set(character_ids)
    query = select(Character).where(
        Character.user_id = user.user_id,
        Character.character_id.in_(cids)
    )
    valid_characters = db.session.execute(query).scalars().all()
    if len(valid_characters) != len(cids):
        raise PermissionError(
            'You do not have permission to access one or more of the Characters.'
        )
    universe.characters = valid_characters

def validate_character_data(data):
    required_fields = ['name', 'main_power_set', 'secondary_power_set', 'skills']
    for field in required_fields:
        if field in data and data[field] is None:
            return False, f'{field.replace("_", " ").capitalize()} cannot be null.'
    if 'universe_ids' in data and not isinstance(data['universe_ids'], list):
        return False, 'Universe Ids must be a list.'
    return True, None


def execute_character_creation(data, user):
    fields = ['name', 'age', 'origin', 'main_power_set', 'secondary_power_set', 'skills']
    character_data = {k:v for k,v in data.items() if k in fields}
    new_character = Character(**character_data, user_id = user.user_id)
    if 'universe_ids' in data:
        add_universes_to_character(data['universe_ids'], user, new_character)
        db.session.add(new_character)
        return new_character


def execute_character_update(character, data, user):
    updatable_fields = ['name', 'age', 'orgin', 'main_powef_set', 'secondary_power_set', 'skills']
    for field in updatable_fields:
        if field in data:
            setattr(character, field, data[field])
    if 'universe_ids' in data:
        add_universes_to_character(data[universe_ids], user, character)


    
def character_with_authorization(user,character_id):
    query = select(Character).where(
        Character.user_id == user.user_id,
        Character.character_id == character_id).options(
            selectinload(Character.universes),
            selectinload(Character.notes)
        )
    character =db.session.execute(query).scalars().first()
    if not character:
        return None
    return character


def characters_with_authorization(user):
    query = select(Character).where(
        Character.user_id == user.user_id).options(
            selectinload(Character.universes),
            selectinload(Character.notes)
        )
    characters =db.session.execute(query).scalars().all()
    if not characters:
        return None
    return characters


def universe_with_authorization(user,universe_id):
    query = select(Universe).where(
        Universe.owner_id == user.user_id,
        Universe.universe_id == universe_id
        ).options(
            selectinload(Universe.characters)
        )
    universe = db.session.execute(query).scalars().first()
    return universe

def universes_with_authorization(user):
    query = select(Universe).where(
        Universe.owner_id == user.user_id
    ).options(
        selectinload(Universe.characters)
    )
    universes = db.session.execute(query).scalars().all()
    return universes 

def validate_universe_data(data, is_creation=False):
    if is_creation:
        required_fields = ['name', 'alignment']
        for field in required_fields:
            if field not in data:
                return False, f"{field.capitalize()} is required."

    for field in ['name', 'alignment']:
        if field in data and data[field] is None:
            return False, f"{field.capitalize()} cannot be null."

    if 'name' in data:
        if not isinstance(data['name'], str) or not data['name'].strip():
            return False, 'Name must be a non-empty string.'

    if 'alignment' in data:
        if not isinstance(data['alignment'], str):
            return False, 'Alignment must be a string.'
        try:
            _ = AlignmentType[data['alignment'].upper()]
        except (KeyError, AttributeError):
            valid_options = [e.name for e in AlignmentType]
            return False, f"Invalid Alignment. Must be one of: {valid_options}"
            
    if 'description' in data and data['description'] is not None:
        if not isinstance(data['description'], str):
            return False, 'Description must be a string.'
        if len(data['description']) > 300:
            return False, 'Description must be 300 characters or less.'

    return True, None

def execute_universe_creation(data, user):
    fields = ['name', 'description', 'alignment']
    universe_data = [k,v for k,v in data.items() if k in fields]
    new_universe = Universe(**universe_data, owner_id = user.user_id)
    db.session.add(new_universe)
    return new_universe


def execute_universe_update(universe, data, user):
    fields = ['name', 'description', 'alignment']
    for field in fields:
        if field in data:
            setattr(universe, field, data[field])
    if 'character_ids' in data:
        add_characters_to_universe(data['character_ids'], user, universe)


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload.get("jti")
    token = db.session.scalar(select(TokenBlocklist).where(TokenBlocklist.jti == jti))
    return token is not None