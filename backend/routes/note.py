from flask import jsonify, request, Blueprint
from sqlalchemy.orm import joinedload, selectinload
from flask_jwt_extended import jwt_required
from sqlalchemy import select
from models import Character, Universe
from config import db
from utils import get_current_user,validate_note_data, execute_note_creation, notes_with_authorization, note_with_authorization, execute_note_update


note_bp = Blueprint ('notes', __name__, url_prefix='/notes')


@note_bp.route('/', methods = ['POST'])
@jwt_required()
def create_note():

    try:
        data = request.get_json() or {}
        if not data:
            return jsonify ({
                'Error': 'Request cannot be empty.'
            }), 400
        user = get_current_user()
        if not user:
            return jsonify({
                'Error': 'Unauthorized.'
            }), 401
        is_valid, error_msg = validate_note_data(data)
        if not is_valid:
            return jsonify({
                'Error': error_msg
            }), 400
        new_note = execute_note_creation(user, data)
        return jsonify({
            'Message': 'Note has been successfully created.',
            'Note': new_note.to_dict()
        }), 201
    except PermissionError as e:
        db.session.rollback()
        return jsonify({
            'Error': str(e)
        }), 403

    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')
        return jsonify({
            'Error': 'Server Error.'
        }), 500




@note_bp.route('/', methods = ['GET'])
@jwt_required()
def get_all_notes():
    user = get_current_user()
    if not user:
        return jsonify({
            'Error': 'User not found.'
        }), 404
    notes = notes_with_authorization(user)
    if not notes:
        return jsonify({
            'Message': 'No notes found.',
            'Notes': []
        }), 200
    return jsonify({
        'Message': 'Notes found.',
        'Notes': [n.to_dict(summary=True) for n in notes]
    }), 200
    


@note_bp.route('/<int:note_id>', methods = ['GET'])
@jwt_required()
def get_note(note_id):
    user = get_current_user()
    if not user:
        return jsonfy({
            'Message': 'User not found.'
        }), 404
    note = note_with_authorization(user, note_id)
    if not note:
        return jsonify({
            'Message': 'Note not found.'
        }), 404
    return jsonify({
        'Message': 'Note found',
        'Note': note.to_dict(summary=False)
    }), 200


@note_bp.route('/<int:note_id>', methods = ['PATCH'])
@jwt_required()
def update_note(note_id):
    user = get_current_user()
    if not user:
        return jsonify({
            'Error': 'Authorization required.'
        }), 401
    data = request.get_json() or {}
    is_valid, error_msg = validate_note_data(data, partial = True)
    if not is_valid:
        return jsonify({
            'Error': error_msg
        }), 400
    note = note_with_authorization(user, note_id)
    if not note:
        return jsonify({
            'Message': 'Note not found.'
        }), 404
    try:
        execute_note_update(user, note, data)
        db.session.commit()
        return jsonify({
            'Message': 'Note successfully Updated', 
            'Note': note.to_dict(summary=True)
        }), 200
    except PermissionError as e:
        db.session.rollback()
        return jsonify({
            'Error': f'{str(e)}'
        }), 403
    except Exception as e:
        db.session.rollback()
        print(f'Error: {e}')
        return jsonify({
            'Error': 'Server error'
        }), 500



@note_bp.route('/<int:note_id>', methods = ['DELETE'])
@jwt_required()
def delete_note(note_id):
    user = get_current_user()
    if not user:
        return jsonify({
            'Error': 'Authorization required.'
        }), 401
    note = note_with_authorization(user, note_id)
    if not note:
        return jsonify({
            'Message': 'Note could not be found.'
        }), 404
    try:
        db.session.delete(note)
        db.session.commit()
        return jsonify({
            'Message': 'Note successfully deleted.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f'Error: {e}')
        return jsonify({
            'Error': 'Server Error.'
        }), 500
