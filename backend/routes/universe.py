from flask import jsonify, Blueprint, request, abort
from models import Universe,AlignmentType, get_current_user
from flask_jwt_extended import jwt_required
from config import db
from sqlalchemy import select
from utils import get_current_user, add_characters_to_universe, universe_with_authorization, universes_with_authorization, validate_universe_data, execute_universe_creation

universe_bp = Blueprint('universes', __name__, url_prefix='/universes')


@universe_bp.route('/', methods=['POST'])
@jwt_required()
def create_universe():
    try:
        user = get_current_user()
        if not user:
            return jsonify({
                'Error': 'Unauthorized.'
            }), 401

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
@jwt_required()
def get_all_universes():
    user = get_current_user()
    if not user:
        return jsonify({
            'Error': 'Unauthorized.'
        }), 401

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
@jwt_required()
def get_universe(universe_id):
    user = get_current_user()
    if not user:
        return jsonify({
            'Error':'Unauthorized.'
        }), 401

    universe = universe_with_authorization(user, universe_id)
    if not universe:
        return jsonify ({
            'Message': 'Universe not found.'
        }), 404
    return jsonify ({
        'Message': f'Universe with id of {universe_id} has been found.',
        'Universe': universe.to_dict()
    }), 200



@universe_bp.route('/<int:universe_id>', methods=['PATCH'])
@jwt_required()
def update_universe(universe_id):
    user = get_current_user()
    data = request.json or {}
    if not user:
        return jsonify({
            'Error': 'Unauthorized.'
        }), 401

    is_valid, error_msg = validate_universe_data(data, partial=True)
    if not is_valid:
        return jsonify({
            'Error': error_msg
        }), 400

    try:
        universe = universe_with_authorization(universe_id)
        if not universe:
            return jsonify({
                'Message': 'Universe not found. '
            }), 404
        
        execute_universe_update(universe, data, user)
        db.session.commit()
        return jsonify({
            'Message': 'Universe has been updated successfully.'
        }), 200

    except (PermissionError, ValueError) as e:
        db.session.rollback()
        print(f'Error:{str(e)}')
        return jsonify({
            'Error': 'Server Error.'
        }), 500
        



@universe_bp.route('/<int:universe_id>', methods=['DELETE'])
@jwt_required()
def delete_universe(universe_id):
    user = get_current_user()
    if not user:
        return jsonify({
            'Error': 'Unauthorized.'
        }), 401
   
    universe = universe_with_authorization(user, universe_id)
    if not universe:
        return jsonify({
        'Message': 'Universe not found'
    }), 404
    try:
        db.session.delete(universe)
        db.session.commit()
        return jsonify({
            'Message': 'Universe successfully deleted.',
            'id': universe_id
        }), 200
    except Exception as e:
        db.session.rollback()
        print (f'Error: {str(e)}')
        return jsonify({
            'Error': 'Error occured'
        }), 500



