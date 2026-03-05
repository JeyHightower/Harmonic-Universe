from flask import session, request
from flask_jwt_extended import get_jwt_identity
from flask_bcrypt import generate_password_hash, check_password_hash
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from models import User, bcrypt, Character, Universe, Note, Location, TokenBlocklist, LocationType, AlignmentType, character_universes, character_notes, character_universes, note_universes, location_notes
from config import  jwt, db
from functools import wraps

#!------------ Universal Helper Function ----------
def get_current_user():
    """Retrieves the current user."""
    user_id = get_jwt_identity()
    if user_id is None:
        return None
    try:
        user_id = int(user_id)
    except(ValueError, TypeError):
        return None
    user = db.session.get(User, user_id)
    return user


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload.get("jti")
    token = db.session.scalar(select(TokenBlocklist).where(TokenBlocklist.jti == jti))
    return token is not None


#! ------------ Auth Helper Functions -----------

def validate_auth_data(data, partial=False): # Fixed: False
    if not partial:
        required_fields = ['name', 'username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return False, f'{field} is required.'

    for field in ['name', 'username', 'email', 'password', 'bio']:
        if field in data:
            val = data[field]

            if not isinstance(val, str):
                return False, f'{field.capitalize()} must be a string.'
            
            clean_val = val.strip()
            if not clean_val:
                return False, f'{field.capitalize()} can not be empty.'
            
            # Constraints
            if field == 'name' and (len(clean_val) < 2 or len(clean_val) > 100):
                return False, 'Name must be between 2 and 100 characters.'
                
            if field == 'username' and (len(clean_val) < 2 or len(clean_val) > 200):
                return False, 'Username must be between 2 and 200 characters.'
        
            if field == 'email':
                if '@' not in clean_val or '.' not in clean_val.split('@')[-1]:
                    return False, 'Invalid email format.'
                if len(clean_val) > 255:
                    return False, 'Email is too long.'  

            if field == 'password' and (len(val) < 8 or len(val) > 250):
                return False, 'Password must be at least 8 characters long.'

            if field == 'bio' and (len(clean_val) < 20 or len(clean_val) > 500):
                return False, 'Bio must be between 20 and 500 characters.'
            
    return True, None



def validate_login_data(data):
    if 'password' not in data:
        return False, 'Password is required.'
    if 'email' not in data and 'username' not in data:
        return False, 'Username or Email is required.'
    return True, None

def authenticate_user(data):
    password = data.get('password').strip()
    identifier = data.get('email') or data.get('username')
    if not identifier or not password:
        return None

    query = select(User).where(
        or_(User.email == identifier, User.username == identifier)
    )
    user = db.session.execute(query).scalar_one_or_none()
    if not user:
        return None

    if bcrypt.check_password_hash(user.password, password):
        return user
    return None
    



def execute_user_creation(data):
    if User.query.filter_by(email=data['email']).first():
        raise ValueError('Email already exists.')
    if User.query.filter_by(username=data['username']).first():
        raise ValueError('Username already exists.')
    
    fields = ['name', 'username', 'email', 'password', 'bio']
    user_data = {k:v for k,v in data.items() if k in fields}
    if 'password' in user_data:
        user_data['password'] = bcrypt.generate_password_hash(user_data['password']).decode('utf-8')

    new_user = User(**user_data)
    db.session.add(new_user)
    db.session.commit()
    return new_user
        


#! ------------ Character Helper Functions -----------

def validate_character_data(data, partial = False):
    if not partial:
        required_fields = ['name', 'main_power_set', 'secondary_power_set', 'skills']
        for field in required_fields:
            if field not in data:
                return False, f'{field.replace("_", " ").capitalize()} is required.'
    for field in ['name', 'main_power_set', 'secondary_power_set', 'skills']:
        if field in data and data[field] is None:
            return False, f'{field.replace("_", " ").capitalize()} cannot be null.'
    for field in ['universe_ids', 'note_ids', 'skills']:
        if field in data and not isinstance(data[field], list):
            return False, f'{field.replace("_", " ").capitalize()} must be a list.'
    if 'origin' in data:
        if not isinstance(data['origin'], str) or len(data['origin']) > 200:
            return False, 'Origin must be a string and must be less than 200 characters long.'
    if 'age' in data:
        if not isinstance(data['age'], int):
            return False, 'Age must be an integer.'
    return True, None


def execute_character_creation(user, data):
    fields = ['name', 'age', 'origin', 'main_power_set', 'secondary_power_set', 'skills']
    character_data = {k:v for k,v in data.items() if k in fields}
    new_character = Character(**character_data, creator_id = user.user_id)
    db.session.add(new_character)
    if 'universe_ids' in data and data['universe_ids']:
        add_universes_to_character(user, new_character, data['universe_ids'])
    if 'note_ids' in data and data['note_ids']:
        add_notes_to_character(user, new_character, data['note_ids'])
    if 'location_ids' in data and data['location_ids']:
        add_locations_to_character(user, new_character, data['location_ids'])
    db.session.commit()
    return new_character


def execute_character_update(user, character, data):
    updatable_fields = ['name', 'age', 'origin', 'main_power_set', 'secondary_power_set', 'skills']
    for field in updatable_fields:
        if field in data:
            setattr(character, field, data[field])
    if 'universe_ids' in data and data['universe_ids']:
        add_universes_to_character(user, character, data['universe_ids'])
    if 'note_ids' in data and data['note_ids']:
        add_notes_to_character(user, character, data['note_ids'])
    if 'location_id' in data and data['location_ids']:
        add_locations_to_character(user, character, data['location_ids'])


def character_with_authorization(user,character_id):
    query = select(Character).where(
        Character.creator_id == user.user_id,
        Character.character_id == character_id).options(
            selectinload(Character.universes),
            selectinload(Character.notes)
        )
    character =db.session.execute(query).scalar_one_or_none()
    if not character:
        return None
    return character


def characters_with_authorization(user):
    query = select(Character).where(
        Character.creator_id == user.user_id).options(
            selectinload(Character.universes),
            selectinload(Character.notes)
        )
    characters =db.session.execute(query).scalars().all()
    if not characters:
        return None
    return characters


def add_universes_to_character(user, character, universe_ids):
    uids = set(universe_ids)
    query = select(Universe).where(
        Universe.creator_id == user.user_id,
        Universe.universe_id.in_(uids)
    )
    valid_universes = db.session.execute(query).scalars().all()
    if len(valid_universes) != len(uids):
        raise PermissionError(
            'You do not have permission to access one or more of the Universes.'
            )
    character.universes = valid_universes

def add_notes_to_character(user, character, note_ids):
    nids = set(note_ids)
    query = select(Note).where(
        Note.creator_id == user.user_id,
        Note.note_id.in_(nids)
    )
    valid_notes = db.session.execute(query).scalars().all()
    if len(nids) != len(valid_notes):
        raise PermissionError(
            'You do not have permission to access one or more of the Notes.'
        )
    character.notes = valid_notes

def add_locations_to_character(user, character, location_ids):
    lids = set(location_ids)
    query = select(Location).where(
        Location.creator_id == user.user_id,
        Location.location_id.in_(lids)
    )
    valid_locations = db.session.execute(query).scalars().all()
    if len(lids) != len(valid_locations):
        raise PermissionError(
            'You do not have access to 1 or more locations.'
        )
    character.locations = valid_locations

#! ------------ Universe Helper Functions -----------

def validate_universe_data(data, partial=False):
    if not partial:
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



def universe_with_authorization(user,universe_id):
    query = select(Universe).where(
        Universe.creator_id == user.user_id,
        Universe.universe_id == universe_id
        ).options(
            selectinload(
                Universe.characters
            ),
            selectinload(
                Universe.notes
            )
        )
    universe = db.session.execute(query).scalar_one_or_none()
    return universe



def universes_with_authorization(user):
    query = select(Universe).where(
        Universe.creator_id == user.user_id
    ).options(
        selectinload(
            Universe.characters
        ),
        selectinload(
            Universe.notes
        )
    )
    universes = db.session.execute(query).scalars().all()
    return universes 



def execute_universe_creation(user, data):
    fields = ['name', 'description', 'alignment']
    universe_data = {k:v for k,v in data.items() if k in fields}
    new_universe = Universe(**universe_data, creator_id = user.user_id)
    if 'character_ids' in data and data['character_ids']:
        add_characters_to_universe(user, new_universe, data['character_ids'])
    if 'note_ids' in data and data['note_ids']:
        add_notes_to_universe(user, new_universe, data['note_ids'])
    if 'location_ids' in data and data['location_ids']:
        add_locations_to_universe(user, new_universe, data['location_ids'])
    db.session.add(new_universe)
    db.session.commit()
    return new_universe



def execute_universe_update(user, universe, data):
    fields = ['name', 'description', 'alignment']
    for field in fields:
        if field in data:
            setattr(universe, field, data[field])
    if 'character_ids' in data and data['character_ids']:
        add_characters_to_universe(user, universe, data['character_ids'])
    if 'note_ids' in data and data['note_ids']:
        add_notes_to_universe(user, universe, data['note_ids'])
    if 'location_ids' in data and data['location_ids']:
        add_locations_to_universe(user, universe, data['location_ids'])



def add_characters_to_universe(user, universe, character_ids):
    cids = set(character_ids)
    query = select(Character).where(
        Character.creator_id == user.user_id,
        Character.character_id.in_(cids)
    )
    valid_characters = db.session.execute(query).scalars().all()
    if len(valid_characters) != len(cids):
        raise PermissionError(
            'You do not have permission to access one or more of the Characters.'
        )
    universe.characters = valid_characters

def add_notes_to_universe(user, universe, note_ids):
    nids = set(note_ids)
    query = select(Note).where(
        Note.creator_id == user.user_id,
        Note.note_id.in_(nids)
    )
    valid_notes = db.session.execute(query).scalars().all()
    if len(nids) != len(valid_notes):
        raise PermissionError(
            'You do not have permission to access one or more of the Notes.'
        )
    universe.notes = valid_notes

def add_locations_to_universe(user, universe, location_ids):
    lids = set(location_ids)
    query = select(Location).where(
        Location.creator_id == user.user_id,
        Location.location_id.in_(lids)
    )
    valid_locations = db.session.execute(query).scalars().all()
    if len(lids) != len(valid_locations):
        raise PermissionError(
            'You do not have access to one or more of the locations.'
        )
    universe.locations = valid_locations



#! ------------ Note Helper Functions -----------

def validate_note_data(data, partial=False):
    if not partial:
        required_fields = ['title']
        for field in required_fields: 
            if field not in data:
                return False, f'{field} is required.'
    if 'title' in data and data['title'] is None:
        return False, 'Title cannot be null.'
    if 'title' in data:
        if not isinstance(data['title'], str):
            return False, 'Title must be a string.'
        title_value = data['title'].strip()
        if not title_value:
            return False, 'Title cannot be empty.'
        if len(title_value) > 100:
            return False, 'Title must be a string and 100 characters or less.'
    if 'content' in data:
        if not isinstance(data['content'], str):
            return False, 'Content must be a string.'
    return True, None


def execute_note_creation(user, data):
    note_fields = ['title', 'content']
    note_data = {k:v for k,v in data.items() if k in note_fields}
    new_note = Note(**note_data, creator_id = user.user_id)
    if 'character_ids' in data and data['character_ids']:
        add_characters_to_note(user, new_note, data['character_ids'])
    if 'universe_ids' in data and data['universe_ids']:
        add_universes_to_note(user, new_note, data['universe_ids'])
    if 'location_ids' in data and data['location_ids']:
        add_locations_to_note(user, new_note, data['universe_ids'])

    db.session.add(new_note)
    db.session.commit()
    return new_note


def execute_note_update(user,note, data):
    note_fields = ['title', 'content']
    for field in note_fields:
        if field in data:
            setattr(note,field,data[field])
    if 'character_ids' in data and data['character_ids']:
        add_characters_to_note(user, note, data['character_ids'])
    if 'universe_ids' in data and data['universe_ids']:
        add_universes_to_note(user, note, data['universe_ids'])
    if 'location_ids' in data and data['location_ids']:
        add_locations_to_note(user, note, data['location_ids'])



def notes_with_authorization(user):
    query = select(Note).where(
        Note.creator_id == user.user_id
    ).options(
        selectinload(
            Note.characters
        ),
        selectinload(
            Note.universes
        )
    )
    notes = db.session.execute(query).scalars().all()
    return notes


def note_with_authorization(user, note_id):
    query = select(Note).where(
        Note.creator_id == user.user_id,
        Note.note_id == note_id
    ).options(
        selectinload(
            Note.characters
        ),
        selectinload(
            Note.universes
        )
    )
    note = db.session.execute(query).scalar_one_or_none()
    return note 


    
def add_characters_to_note(user, note, character_ids):
    cids = set(character_ids)
    query = select(Character).where(
        Character.creator_id == user.user_id,
        Character.character_id.in_(cids)
    )
    valid_characters = db.session.execute(query).scalars().all()
    if len(cids) != len(valid_characters):
        raise PermissionError(
            'You do not have permission for one or more charactes.'
        )
    note.characters = valid_characters


def add_universes_to_note(user, note, universe_ids):
    uids = set(universe_ids)
    query = select(Universe).where(
        Universe.creator_id == user.user_id,
        Universe.universe_id.in_(uids)
    )
    valid_universes = db.session.execute(query).scalars().all()
    if len(uids) != len(valid_universes):
        raise PermissionError(
            'You do not have permssion for one or more universes.'
        )
    note.universes = valid_universes

def add_locations_to_note(user, note, location_ids):
    lids = set(location_ids)
    query = select(Locations).where(
        Location.creator_id == user.user_id,
        Location.location_id.in_(lids)
    )
    valid_locations = db.session.execute(query).scalars().all()
    if len(lids) != len(valid_locations):
        raise PermissionError(
            'You do not have access to one or more locations.'
        )
    note.locations = valid_locations



#! ------------ Location Helper Functions -----------

def validate_location_data(data, partial=False):
    if not partial:
        required_field = ['name', 'location_type', 'universe_id']
        for field in required_field:
            if field not in data:
                return False, f'{field} data is required.'

    for field in ['name', 'location_type', 'universe_id']:
        if field in data and data[field] is None:
            return False, f'{field} cannot be empty.' 

    if 'name' in data:
        if not isinstance(data['name'], str):
            return False, 'Name must be a string.'
        clean_name = data['name'].strip()
        if len(clean_name) < 2:
            return False, 'Name must be at least 2 characters long.'
    if 'location_type' in data:
        if not isinstance(data['location_type'], str):
            return False, 'Location Type must be a string.'
        try:
            _ = LocationType[data['location_type'].upper()]
        except (KeyError, AttributeError):
            valid_options = [e.name for e in LocationType]
            return False, f"Invalid Location Type: {', '.join(valid_options)}"
    if 'description' in data:
        if not isinstance(data['description'], str):
            return False, 'Description must be a string.'
        clean_description = data['description'].strip()
        if len(clean_description) > 500:
            return False, 'Description must be less than 500 characters.'
    return True, None


def execute_location_creation(user, data):
    universe_id = data.get('universe_id')
    query = select(Universe).where(
        Universe.creator_id == user.user_id,
        Universe.universe_id == universe_id
    )
    universe = db.session.execute(query).scalar_one_or_none()
    if not universe:
        raise ValueError(
            'Invalid Universe:You do not have permission to add locations here.'
        )
    fields = ['name', 'location_type', 'description']
    location_data = {k:v for k,v in data.items() if k in fields}
    new_location = Location(**location_data, creator_id = user.user_id, universe_id = universe.universe_id)
    db.session.add(new_location)
    
    if 'character_ids' in data and data['character_ids']:
        add_characters_to_location(user, new_location, data['character_ids'])

    if 'note_ids' in data and data['note_ids']:
        add_notes_to_location(user, new_location, data['note_ids'])
    db.session.commit()
    return new_location




def add_characters_to_location(user, location, character_ids):
    cids = set(character_ids)
    query = select(Character).where(
        Character.creator_id == user.user_id,
        Character.character_id.in_(cids)
    )
    valid_characters = db.session.execute(query).scalars().all()
    if len(cids) != len(valid_characters):
        raise PermissionError(
            'You do not have authorization for one or more characters'
        )
    location.characters = valid_characters


def add_notes_to_location(user, location, note_ids):
    nids = set(note_ids)
    query = select(Note).where(
        Note.creator_id == user.user_id,
        Note.note_id.in_(nids)
    )
    valid_notes = db.session.execute(query).scalars().all()
    if len(nids) != len(valid_notes):
        raise PermissionError(
            'You do not have authorization for one or more notes.'
        )
    location.notes = valid_notes

def locations_with_authorization_in_universe(user,universe_id):
    query = select(Location).where(
        Location.universe_id == universe_id,
        Location.creator_id == user.user_id
    ).options(
        selectinload(Location.notes),
        selectinload(Location.characters)
    )
    locations = db.session.execute(query).scalars().all()
    return locations


def location_with_authorization(user,location_id):
    query = select(Location).where(
        Location.location_id == location_id,
        Location.creator_id == user.user_id,
    ).options(
        selectinload(Location.notes),
        selectinload(Location.characters)
    )
    location = db.session.execute(query).scalar_one_or_none()
    return location


def execute_location_update(user,location, data):
    location_fields = ['name', 'location_type', 'description']
    for field in location_fields:
        if field in data:
            setattr(location, field, data[field])
    if 'character_ids' in data and data['character_ids']:
        add_characters_to_location(user,location,data['character_ids'])
    if 'note_ids' in data and data['note_ids']:
        add_notes_to_location(user, location, data['note_ids'])


#!------------ User Helper Function ----------

def execute_get_all_users():
    query = select(User)
    all_users = db.session.execute(query).scalars().all()
    return [{'id': user.user_id, 'name': user.name } for user in all_users]


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user or not user.is_admin:
            return jsonify({
                'Message': 'Permission Denied, Admin only.'
            }), 403
        return f(user, *args, **kwargs)
    return decorated

