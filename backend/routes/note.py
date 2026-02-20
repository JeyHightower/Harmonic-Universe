from flask import jsonify, request, Blueprint
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import select
from models import Character, Universe
from config import db
from utils import get_current_user


note_bp = Blueprint ('notes', __name__, url_prefix='/notes')


@note_bp.route('/', methods = ['POST'])
def create_note():

    try:
        data = request.json
        if not data:
            return jsonify ({
                'Message': 'Request cannot be empty.'
            }), 400
        user = get_current_user()
        if not user:
            return jsonify({
                'Message': 'Authorization required.'
            }), 401

        new_note = Note(
            title = data.get('title'),
            content = data.get('content'),
            creator_id = user.user_id
         )

        character_ids = data.get('character_ids', [])
        if character_ids:
            query = select(Character). where(Character.character_id.in_ (character_ids),
            Character.creator_id == user.user_id)
            valid_characters = db.session.execute(query).scalars().all()
            if len(valid_characters) != len(character_ids):
                return jsonify({
                    'Mesage': 'One or more characters IDs are invalid or unauthorized.' 
                }), 403
            new_note.characters.append(valid_characters)

        db.session.add(new_note)
        db.session.commit()
        db.session.refresh(new_note)

        return jsonify({
            'Message': 'Note has been created successfully.',
            'Note': new_note.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f'Error: {e}')
        return jsonify ({
            'Message': 'Error has occured.'
        }), 500       



@note_bp.route('/', methods = ['GET'])
def get_all_notes():
    user = get_current_user()
    if not user:
        return jsonify({
            'Method': 'Authorization required.'
        }), 401

    query = select(Note).where(Note.creator_id == user.user_id).options(selectinload(Note.characters))
    notes = db.session.execute(query).scalars().all()


    if not notes:
        return jsonify({
            'Message': 'Notes could not be found.'
        }), 404

    return jsonify({
        'Message': 'Notes have been found',
        'Notes': [ n.to_dict() for n in notes ]
    }), 200


@note_bp.route('/<int:note_id>', methods = ['GET'])
def get_note(note_id):
    user = get_current_user()
    if not user: 
        return jsonify({
            'Message': 'Authorization required.'
        }), 401
    query = select(Note).where(
        Note.note_id == note_id,
        Note.creator_id == user.user_id
    ).options(selectinload(Note.characters))
    note = db.session.execute(query).scalars().first()
    if not note:
        return jsonify({
            'Message': 'Note not found.'
        }), 404
    return jsonify({
        'Message': 'Note has been found.',
        'Note': note.to_dict()
    }), 200