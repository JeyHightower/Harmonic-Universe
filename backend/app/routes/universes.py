"""
Universe routes.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.db import db
from app.models.universe import Universe
from app.schemas.universe import Universe, UniverseCreate, UniverseUpdate, UniverseResponse, UniverseWithParameters

universes_bp = Blueprint('universes', __name__, url_prefix='/universes')

@universes_bp.route('', methods=['GET'])
@jwt_required()
def get_universes():
    """Get all universes."""
    try:
        universes = Universe.query.all()
        return jsonify([UniverseResponse.from_orm(u).dict() for u in universes]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@universes_bp.route('', methods=['POST'])
@jwt_required()
def create_universe():
    """Create new universe."""
    try:
        # Get current user
        creator_id = get_jwt_identity()

        # Validate request data
        data = universe_create_schema.load(request.json)

        # Create universe
        universe = Universe(
            name=data['name'],
            description=data.get('description'),
            creator_id=creator_id,
            physics_parameters=data.get('physics_parameters', {}),
            music_parameters=data.get('music_parameters', {})
        )
        db.session.add(universe)
        db.session.commit()

        return jsonify(universe_schema.dump(universe)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@universes_bp.route('/<uuid:universe_id>', methods=['GET'])
@jwt_required()
def get_universe(universe_id):
    """Get universe by ID."""
    try:
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404
        return jsonify(universe_schema.dump(universe)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@universes_bp.route('/<uuid:universe_id>', methods=['PUT'])
@jwt_required()
def update_universe(universe_id):
    """Update universe."""
    try:
        # Check if universe exists
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        # Check if current user is the creator
        current_user_id = get_jwt_identity()
        if str(universe.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        # Validate and update universe data
        data = universe_update_schema.load(request.json)
        for key, value in data.items():
            setattr(universe, key, value)
        db.session.commit()

        return jsonify(universe_schema.dump(universe)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@universes_bp.route('/<uuid:universe_id>', methods=['DELETE'])
@jwt_required()
def delete_universe(universe_id):
    """Delete universe."""
    try:
        # Check if universe exists
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        # Check if current user is the creator
        current_user_id = get_jwt_identity()
        if str(universe.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        # Delete universe
        db.session.delete(universe)
        db.session.commit()

        return jsonify({'message': 'Universe deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@universes_bp.route('/<uuid:universe_id>/parameters', methods=['GET'])
@jwt_required()
def get_universe_parameters(universe_id):
    """Get universe parameters."""
    try:
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404
        return jsonify(universe_with_parameters_schema.dump(universe)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
