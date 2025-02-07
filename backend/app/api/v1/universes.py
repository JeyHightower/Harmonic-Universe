from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.universe import Universe
from app.models.user import User
from app import db
from app.websocket.handler import manager
import json

universes_bp = Blueprint('universes', __name__)

@universes_bp.route('/', methods=['GET'])
@jwt_required()
def get_universes():
    """Get all universes accessible to the user."""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)

    # Get user's universes and public universes
    universes = Universe.query.filter(
        (Universe.user_id == current_user_id) | (Universe.is_public == True)
    ).all()

    return jsonify([universe.to_dict() for universe in universes]), 200

@universes_bp.route('/<int:universe_id>', methods=['GET'])
@jwt_required()
def get_universe(universe_id):
    """Get a specific universe."""
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if universe.user_id != current_user_id and not universe.is_public:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify(universe.to_dict()), 200

@universes_bp.route('/', methods=['POST'])
@jwt_required()
def create_universe():
    """Create a new universe."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    universe = Universe(
        name=data['name'],
        description=data.get('description', ''),
        is_public=data.get('is_public', False),
        user_id=current_user_id,
        physics_params=data.get('physics_params', {}),
        harmony_params=data.get('harmony_params', {})
    )
    universe.save()

    return jsonify(universe.to_dict()), 201

@universes_bp.route('/<int:universe_id>', methods=['PUT'])
@jwt_required()
def update_universe(universe_id):
    """Update a universe."""
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if universe.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    universe.update(**{
        'name': data.get('name', universe.name),
        'description': data.get('description', universe.description),
        'is_public': data.get('is_public', universe.is_public),
        'physics_params': data.get('physics_params', universe.physics_params),
        'harmony_params': data.get('harmony_params', universe.harmony_params)
    })

    # Broadcast update to connected clients
    manager.broadcast_to_universe(str(universe_id), 'universe_updated', universe.to_dict())

    return jsonify(universe.to_dict()), 200

@universes_bp.route('/<int:universe_id>', methods=['DELETE'])
@jwt_required()
def delete_universe(universe_id):
    """Delete a universe."""
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if universe.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    universe.delete()

    # Notify connected clients
    manager.broadcast_to_universe(str(universe_id), 'universe_deleted', {'universe_id': universe_id})

    return '', 204

@universes_bp.route('/<int:universe_id>/physics', methods=['PUT'])
@jwt_required()
def update_physics(universe_id):
    """Update physics parameters."""
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if universe.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    universe.update_physics(data)

    # Calculate and return new harmony
    harmony = universe.calculate_harmony(data)

    # Broadcast updates
    manager.broadcast_to_universe(str(universe_id), 'physics_changed', {
        'universe_id': universe_id,
        'parameters': data
    })
    manager.broadcast_to_universe(str(universe_id), 'harmony_changed', {
        'universe_id': universe_id,
        'harmony': harmony
    })

    return jsonify({
        'physics': data,
        'harmony': harmony
    }), 200

@universes_bp.route('/<int:universe_id>/story', methods=['POST'])
@jwt_required()
def add_story_point(universe_id):
    """Add a story point."""
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if universe.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    universe.update_story(data)

    # Broadcast update
    manager.broadcast_to_universe(str(universe_id), 'story_changed', {
        'universe_id': universe_id,
        'story_point': data
    })

    return jsonify(universe.to_dict()), 200

@universes_bp.route('/<int:universe_id>/export', methods=['GET'])
@jwt_required()
def export_universe(universe_id):
    """Export universe data."""
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if universe.user_id != current_user_id and not universe.is_public:
        return jsonify({'error': 'Unauthorized'}), 403

    format = request.args.get('format', 'json')

    if format == 'json':
        return jsonify(json.loads(universe.export_to_json())), 200
    elif format == 'audio':
        audio_url = universe.export_audio()
        return jsonify({'audio_url': audio_url}), 200
    else:
        return jsonify({'error': 'Unsupported export format'}), 400
