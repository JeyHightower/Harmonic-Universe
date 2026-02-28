from config import db
from flask import jsonify, Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import select
from utils import get_current_user, validate_location_data, execute_location_creation, add_characters_to_location, add_notes_to_location, locations_with_authorization_in_universe, location_with_authorization, execute_location_update

location_bp = Blueprint('locations', __name__)

@location_bp.route('/universes/<int:universe_id>/locations', methods=['POST'])
@jwt_required()
def create_location(universe_id):
    data = request.get_json() or {}

    is_valid, error_msg = validate_location_data(data)
    if not is_valid:
        return jsonify({
            'Error': error_msg
        }), 400
    
    user = get_current_user()
    if not user:
        return jsonify({
            'Message': 'Unauthorized. User required.'
        }), 401
    try:
        location = execute_location_creation(user, data)
        return jsonify({
            'Message': 'Location successfully created.',
            'Location': location.to_dict(summary=True)
        }), 201
    except (ValueError, PermissionError) as e:
        db.session.rollback()
        return jsonify({
            'Error': str(e)
        }), 400
    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')
        return jsonify({
            'Error': 'Server Error'
        }), 500

@location_bp.route('/universes/<int:universe_id>/locations', methods=['GET'])
@jwt_required()
def get_all_locations_for_universe(universe_id):
    user = get_current_user()
    if not user:
        return jsonify({
            'Message': 'Unauthorized. User required.'
        }), 401
    locations = locations_with_authorization_in_universe(user, universe_id)
    if not locations:
        return jsonify({
            'Message': 'No locations found.',
            'Locations': []
        }), 200
    return jsonify({
        'Message': 'Locations found.',
        'Locations': [location.to_dict(summary=True) for location in locations]
    }), 200


@location_bp.route('/locations/<int:location_id>', methods=['GET'])
@jwt_required()
def get_location(location_id):
    user = get_current_user()
    if not user:
        return jsonify({
            'Message': 'Unauthorized. User required.'
        }), 401
    location = location_with_authorization(user,location_id)
    if not location:
        return jsonify({
            'Message': 'Location could not be found.'
        }), 404
    return jsonify({
        'Message': 'Location found.',
        'Location': location.to_dict(summary=False)
    }), 200

@location_bp.route('/locations/<int:location_id>', methods=['PATCH'])
@jwt_required()
def update_location(location_id):
    data = request.get_json() or {} 
    is_valid, error_msg = validate_location_data(data, partial=True)
    if not is_valid:
        return jsonify({
            'Error': error_msg
        }), 400
    user = get_current_user()
    if not user:
        return jsonify({
            Message: 'Unauthorized. User is required.'
        }), 401
    location = location_with_authorization(user,location_id)
    if not location:
        return jsonify({
            'Message': 'Location could not be found.'
        }), 404
    try:
        execute_location_update(user, location, data)
        db.session.commit()
        return jsonify({
            'Message': 'Location has been successfully updated.',
            'Location': location.to_dict(summary=False)
        }),200
    except (ValueError, PermissionError) as e:
        db.session.rollback()
        return jsonify({
            'Error': str(e)
        }), 400
    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')
        return jsonify({
            'Error': 'Server Error.'
        }), 500

@location_bp.route('/locations/<int:location_id>', methods=['DELETE'])
@jwt_required()
def delete_location(location_id):
    user = get_current_user()
    if not user:
        return jsonify({
            'Message': 'Unauthorized. User is required.'
        }), 401
    location = location_with_authorization(user, location_id)
    if not location:
        return jsonify({
            'Message': 'Location could not be found.'
        }), 404
    try:
        db.session.delete(location)
        db.session.commit()
        return jsonify({
            'Message': 'Location sucessfully deleted.'
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')
        return jsonify({
            'Error': 'Server Error.'
        }), 500
