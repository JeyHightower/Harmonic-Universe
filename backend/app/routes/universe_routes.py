# app/routes/universe_routes.py
from flask import Blueprint, jsonify, request, g
from app.models.universe import Universe
from app import db
from app.utils.token_manager import auto_token
from werkzeug.exceptions import NotFound

universe_bp = Blueprint('universe', __name__)

@universe_bp.route('/', methods=['POST'])
@auto_token
def create_universe():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided', 'type': 'validation_error'}), 400

        if 'name' not in data or not data['name'].strip():
            return jsonify({'error': 'Name is required', 'type': 'validation_error'}), 400

        # Validate name length
        name = data['name'].strip()
        if len(name) < 3 or len(name) > 100:
            return jsonify({'error': 'Name must be between 3 and 100 characters', 'type': 'validation_error'}), 400

        # Validate numeric parameters
        gravity_constant = data.get('gravity_constant', 9.81)
        environment_harmony = data.get('environment_harmony', 1.0)

        if not isinstance(gravity_constant, (int, float)) or gravity_constant <= 0:
            return jsonify({'error': 'Gravity constant must be a positive number', 'type': 'validation_error'}), 400

        if not isinstance(environment_harmony, (int, float)) or not 0 <= environment_harmony <= 1:
            return jsonify({'error': 'Environment harmony must be between 0 and 1', 'type': 'validation_error'}), 400

        new_universe = Universe(
            name=name,
            description=data.get('description', '').strip(),
            gravity_constant=gravity_constant,
            environment_harmony=environment_harmony,
            creator_id=g.current_user.id
        )

        db.session.add(new_universe)
        db.session.commit()

        return jsonify({
            'message': 'Universe created successfully',
            'universe': new_universe.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'An error occurred while creating the universe',
            'type': 'server_error',
            'details': str(e)
        }), 500

@universe_bp.route('/', methods=['GET'])
@auto_token
def get_universes():
    try:
        universes = Universe.query.filter_by(creator_id=g.current_user.id).all()
        return jsonify([u.to_dict() for u in universes]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/<int:id>', methods=['GET'])
@auto_token
def get_universe(id):
    try:
        universe = Universe.query.get(id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        return jsonify(universe.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/<int:id>', methods=['PUT'])
@auto_token
def update_universe(id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided', 'type': 'validation_error'}), 400

        universe = Universe.query.get(id)
        if not universe:
            return jsonify({'error': 'Universe not found', 'type': 'not_found_error'}), 404
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized', 'type': 'authorization_error'}), 403

        # Validate name if provided
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'error': 'Name cannot be empty', 'type': 'validation_error'}), 400
            if len(name) < 3 or len(name) > 100:
                return jsonify({'error': 'Name must be between 3 and 100 characters', 'type': 'validation_error'}), 400
            universe.name = name

        # Validate description if provided
        if 'description' in data:
            universe.description = data['description'].strip()

        # Validate gravity constant if provided
        if 'gravity_constant' in data:
            gravity_constant = data['gravity_constant']
            if not isinstance(gravity_constant, (int, float)) or gravity_constant <= 0:
                return jsonify({'error': 'Gravity constant must be a positive number', 'type': 'validation_error'}), 400
            universe.gravity_constant = gravity_constant

        # Validate environment harmony if provided
        if 'environment_harmony' in data:
            harmony = data['environment_harmony']
            if not isinstance(harmony, (int, float)) or not 0 <= harmony <= 1:
                return jsonify({'error': 'Environment harmony must be between 0 and 1', 'type': 'validation_error'}), 400
            universe.environment_harmony = harmony

        db.session.commit()
        return jsonify({
            'message': 'Universe updated successfully',
            'universe': universe.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'An error occurred while updating the universe',
            'type': 'server_error',
            'details': str(e)
        }), 500

@universe_bp.route('/<int:id>', methods=['DELETE'])
@auto_token
def delete_universe(id):
    try:
        universe = Universe.query.get(id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        db.session.delete(universe)
        db.session.commit()
        return jsonify({'message': 'Universe deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
