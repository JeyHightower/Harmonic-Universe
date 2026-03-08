from config import db
from flask import jsonify, Blueprint, request
from flask_jwt_extended import jwt_required
from models import Location
from sqlalchemy import select
from utils import get_current_user, validate_location_data, load_location_with_relationships, token_and_user_required, resource_owner_required, execute_location_creation, add_characters_to_location, add_notes_to_location, locations_with_authorization_in_universe, execute_location_update

location_bp = Blueprint('locations', __name__)

@location_bp.route('/universes/<int:universe_id>/locations', methods=['POST'])
@token_and_user_required
def create_location(user,universe_id):
    data = request.get_json() or {}

    is_valid, error_msg = validate_location_data(data)
    if not is_valid:
        return jsonify({
            'Error': error_msg
        }), 400
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
@token_and_user_required
def get_all_locations_for_universe(user, universe_id):
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
@token_and_user_required
@resource_owner_required(Location)
def get_location(user, location, *args, **kwargs):
    location_with_relationships = load_location_with_relationships(user,location.location_id)
    if not location_with_relationships:
        return jsonify({
            'Message': 'Location could not be found.'
        }), 404
    return jsonify({
        'Message': 'Location found.',
        'Location': location_with_relationships.to_dict(summary=False)
    }), 200

@location_bp.route('/locations/<int:location_id>', methods=['PATCH'])
@token_and_user_required
@resource_owner_required(Location)
def update_location(user, location, *args, **kwargs):
    data = request.get_json() or {} 
    is_valid, error_msg = validate_location_data(data, partial=True)
    if not is_valid:
        return jsonify({
            'Error': error_msg
        }), 400
    try:
        execute_location_update(user, location, data)
        db.session.commit()
        return jsonify({
            'Message': 'Location has been successfully updated.',
            'Location': location.to_dict(summary=True)
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
@token_and_user_required
@resource_owner_required(Location)
def delete_location(user, location, *args, **kwargs):
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
