from flask import Blueprint, jsonify, request
from datetime import datetime

bp = Blueprint('universes', __name__, url_prefix='/api/universes')

# Mock database for testing
universes_db = {}

@bp.route('', methods=['GET', 'POST'])
def handle_universes():
    if request.method == 'GET':
        return jsonify({
            'status': 'success',
            'universes': list(universes_db.values())
        }), 200

    data = request.get_json()
    if not data:
        return jsonify({
            'status': 'error',
            'error': 'No data provided'
        }), 400

    # Validate required fields
    required_fields = ['name']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({
            'status': 'error',
            'error': f'Missing required fields: {", ".join(missing_fields)}'
        }), 400

    universe_id = len(universes_db) + 1
    new_universe = {
        "id": universe_id,
        "name": data['name'],
        "description": data.get('description', ''),  # Make description optional
        "isPublic": data.get('isPublic', False),
        "allowGuests": data.get('allowGuests', False),
        "createdAt": datetime.now().isoformat()
    }
    universes_db[universe_id] = new_universe
    return jsonify({
        'status': 'success',
        'universe': new_universe
    }), 201

@bp.route('/<int:universe_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_universe(universe_id):
    universe = universes_db.get(universe_id)
    if not universe:
        return jsonify({
            'status': 'error',
            'error': 'Universe not found'
        }), 404

    if request.method == 'GET':
        return jsonify({
            'status': 'success',
            'universe': universe
        }), 200

    elif request.method == 'PUT':
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'error': 'No data provided'
            }), 400

        universe.update(data)
        return jsonify({
            'status': 'success',
            'universe': universe
        }), 200

    elif request.method == 'DELETE':
        del universes_db[universe_id]
        return jsonify({
            'status': 'success',
            'message': 'Universe deleted successfully'
        }), 200  # Changed from 204 to match test expectations
