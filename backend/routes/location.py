

location_bp = Blueprint('locations', __name__, url_prefix='/locations')

@location_bp.route('/', methods=['POST'])
@jwt_required()
def create_location():
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

@location_bp.route('/universes/<int:universe_id>', methods=['GET'])
@jwt_required()
def get_all_locations(universe_id):
    user = get_current_user()
    if not user:
        return jsonify({
            'Message': 'Unauthorized. User required.'
        }), 401
    locations = locations_with_authorization(user, universe_id)
    if not locations:
        return jsonify({
            'Message': 'No locations found.',
            'Locations': []
        }), 200
    return jsonify({
        'Message': 'Locations found.',
        'Locations': [l_to_dict(summary=True) for l in locations]
    }), 200


@location_bp.route('/universes/<int:universe_id>/<int:location_id>')
@jwt_required()
def get_location(universe_id, location_id):
    user = get_current_user()
    if not user:
        return jsonify({
            'Message': 'Unauthorized. User required.'
        }), 401
    location = location_with_authorization(user, universe_id, location_id)
    if not location:
        return jsonify({
            'Message': 'Location could not be found.'
        }), 404
    return jsonify({
        'Message': 'Location found.',
        'Location': location.to_dict(summary=False)
    }), 200

@location_bp.route('/<int:location_id>', methods=['PATCH'])
@jwt_required()
def update_location(location_id):
    data = request.get_json() or {} 
    is_valid, error_msg = validate_location_data(data, partial=True):
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
        print(f'Error': {str(e)})
        return jsonify({
            'Error': 'Server Error.'
        }), 500

@location_bp.route('/<int:location_id>', methods=['DELETE'])
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
