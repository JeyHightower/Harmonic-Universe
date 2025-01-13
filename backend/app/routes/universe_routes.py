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
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400

    new_universe = Universe(
        name=data['name'],
        description=data.get('description', ''),
        gravity_constant=data.get('gravity_constant', 9.81),
        environment_harmony=data.get('environment_harmony', 1.0),
        creator_id=g.current_user.id
    )

    try:
        db.session.add(new_universe)
        db.session.commit()
        return jsonify({
            'message': 'Universe created successfully',
            'universe': new_universe.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
    data = request.get_json()
    try:
        universe = Universe.query.get(id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        if 'name' in data:
            universe.name = data['name']
        if 'description' in data:
            universe.description = data['description']
        if 'gravity_constant' in data:
            universe.gravity_constant = data['gravity_constant']
        if 'environment_harmony' in data:
            universe.environment_harmony = data['environment_harmony']

        db.session.commit()
        return jsonify({
            'message': 'Universe updated successfully',
            'universe': universe.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
