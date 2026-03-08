from flask import jsonify, Blueprint, request, abort
from models import Universe,AlignmentType, get_current_user
from config import db
from sqlalchemy import select
from utils import get_current_user, token_and_user_required, resource_owner_required, execute_universe_update, add_characters_to_universe, load_universe_with_relationships, universes_with_authorization, validate_universe_data, execute_universe_creation

universe_bp = Blueprint('universes', __name__, url_prefix='/universes')


@universe_bp.route('/', methods=['POST'])
@token_and_user_required
def create_universe(user):
    try:
        data = request.get_json() or {}
        if not data:
            return jsonify({'Error': 'Data is required'}), 400

        is_valid, error_msg = validate_universe_data(data)
        if not is_valid:
            return jsonify({
                'Error': error_msg
            }), 400
        
        new_universe = execute_universe_creation(user, data)
        return jsonify({
            'Message': 'Universe created successfully',
            'universe': new_universe.to_dict()
            }), 201

    except Exception as e:
        db.session.rollback()
        print(f'Error:{str(e)}')
        return jsonify({
            'Error': 'Server Error.'
        }), 500



@universe_bp.route('/', methods=['GET'])
@token_and_user_required
def get_all_universes(user):
    universes = universes_with_authorization(user)
    if not universes:
        return jsonify({
            'Message': 'No universes found.'
        }), 404

    return jsonify({
        'Message': 'Universes found', 
        'Universes': [u.to_dict() for u in universes]
    }), 200


@universe_bp.route('/<int:universe_id>', methods=['GET'])
@token_and_user_required
@resource_owner_required(Universe)
def get_universe(user, universe, *args, **kwargs):
    universe_with_relationships = load_universe_with_relationships(user,universe.universe_id)
    if not universe_with_relationships:
        return jsonify ({
            'Message': 'Universe not found.'
        }), 404
    return jsonify ({
        'Message': f'Universe with id of {universe_with_relationships.universe_id} has been found.',
        'Universe': universe_with_relationships.to_dict()
    }), 200



@universe_bp.route('/<int:universe_id>', methods=['PATCH'])
@token_and_user_required
@resource_owner_required(Universe)
def update_universe(user, universe, *args, **kwargs):
    data = request.get_json() or {} 
    is_valid, error_msg = validate_universe_data(data, partial=True)
    if not is_valid:
        return jsonify({
            'Error': error_msg
        }), 400

    try:
        execute_universe_update(user, universe, data)
        db.session.commit()
        return jsonify({
            'Message': 'Universe has been updated successfully.',
            'Universe': universe.to_dict(summary=True)
        }), 200

    except (PermissionError, ValueError) as e:
        db.session.rollback()
        print(f'Error:{str(e)}')
        return jsonify({
            'Error': 'Server Error.'
        }), 500
        



@universe_bp.route('/<int:universe_id>', methods=['DELETE'])
@token_and_user_required
@resource_owner_required(Universe)
def delete_universe(user, universe, *args, **kwargs):
    try:
        db.session.delete(universe)
        db.session.commit()
        return jsonify({
            'Message': 'Universe successfully deleted.',
            'id': universe.universe_id
        }), 200
    except Exception as e:
        db.session.rollback()
        print (f'Error: {str(e)}')
        return jsonify({
            'Error': 'Error occured'
        }), 500



