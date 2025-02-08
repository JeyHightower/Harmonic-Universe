from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, socketio
from app.models.universe import Universe
from app.core.errors import ValidationError, NotFoundError, AuthorizationError

universe_bp = Blueprint('universe', __name__)

@universe_bp.route('/', methods=['GET'])
@jwt_required()
def get_universes():
    current_user_id = get_jwt_identity()
    universes = Universe.query.filter(
        (Universe.user_id == current_user_id) | (Universe.is_public == True)
    ).all()
    return jsonify([u.to_dict() for u in universes])

@universe_bp.route('/<int:universe_id>', methods=['GET'])
@jwt_required()
def get_universe(universe_id):
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if not universe.is_public and universe.user_id != current_user_id:
        raise AuthorizationError('Not authorized to view this universe')

    return jsonify(universe.to_dict())

@universe_bp.route('/', methods=['POST'])
@jwt_required()
def create_universe():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    if not all(k in data for k in ('name',)):
        raise ValidationError('Missing required fields')

    universe = Universe(
        name=data['name'],
        description=data.get('description'),
        is_public=data.get('is_public', False),
        physics_params=data.get('physics_params', {}),
        harmony_params=data.get('harmony_params', {}),
        story_points=data.get('story_points', []),
        metadata=data.get('metadata', {}),
        user_id=current_user_id
    )
    universe.save()

    return jsonify(universe.to_dict()), 201

@universe_bp.route('/<int:universe_id>', methods=['PUT'])
@jwt_required()
def update_universe(universe_id):
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if universe.user_id != current_user_id:
        raise AuthorizationError('Not authorized to update this universe')

    data = request.get_json()
    allowed_fields = {
        'name', 'description', 'is_public', 'physics_params',
        'harmony_params', 'story_points', 'metadata'
    }
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    universe.update(**update_data)

    # Notify connected clients about the update
    socketio.emit('universe_updated', {
        'universe_id': universe_id,
        'data': universe.to_dict()
    }, room=f'universe_{universe_id}')

    return jsonify(universe.to_dict())

@universe_bp.route('/<int:universe_id>', methods=['DELETE'])
@jwt_required()
def delete_universe(universe_id):
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if universe.user_id != current_user_id:
        raise AuthorizationError('Not authorized to delete this universe')

    universe.delete()
    return '', 204

@universe_bp.route('/<int:universe_id>/physics', methods=['PUT'])
@jwt_required()
def update_physics(universe_id):
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if universe.user_id != current_user_id:
        raise AuthorizationError('Not authorized to update this universe')

    data = request.get_json()
    universe.update_physics(data)

    # Notify connected clients about the physics update
    socketio.emit('physics_changed', {
        'universe_id': universe_id,
        'parameters': universe.physics_params
    }, room=f'universe_{universe_id}')

    return jsonify(universe.to_dict())

@universe_bp.route('/<int:universe_id>/harmony', methods=['PUT'])
@jwt_required()
def update_harmony(universe_id):
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if universe.user_id != current_user_id:
        raise AuthorizationError('Not authorized to update this universe')

    data = request.get_json()
    universe.update_harmony(data)

    # Notify connected clients about the harmony update
    socketio.emit('harmony_changed', {
        'universe_id': universe_id,
        'parameters': universe.harmony_params
    }, room=f'universe_{universe_id}')

    return jsonify(universe.to_dict())

@universe_bp.route('/<int:universe_id>/story-points', methods=['POST'])
@jwt_required()
def add_story_point(universe_id):
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if universe.user_id != current_user_id:
        raise AuthorizationError('Not authorized to update this universe')

    data = request.get_json()
    if not all(k in data for k in ('title', 'description')):
        raise ValidationError('Missing required fields')

    universe.add_story_point(data)

    # Notify connected clients about the new story point
    socketio.emit('story_changed', {
        'universe_id': universe_id,
        'story_points': universe.story_points
    }, room=f'universe_{universe_id}')

    return jsonify(universe.to_dict())

@universe_bp.route('/<int:universe_id>/story-points/<int:point_id>', methods=['DELETE'])
@jwt_required()
def remove_story_point(universe_id, point_id):
    current_user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(universe_id)

    if universe.user_id != current_user_id:
        raise AuthorizationError('Not authorized to update this universe')

    universe.remove_story_point(point_id)

    # Notify connected clients about the story point removal
    socketio.emit('story_changed', {
        'universe_id': universe_id,
        'story_points': universe.story_points
    }, room=f'universe_{universe_id}')

    return '', 204

# WebSocket event handlers
@socketio.on('join_universe')
@jwt_required()
def on_join_universe(data):
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    room = f'universe_{universe_id}'
    socketio.join_room(room)
    socketio.emit('user_joined', {
        'user_id': get_jwt_identity(),
        'universe_id': universe_id
    }, room=room)

@socketio.on('leave_universe')
@jwt_required()
def on_leave_universe(data):
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    room = f'universe_{universe_id}'
    socketio.leave_room(room)
    socketio.emit('user_left', {
        'user_id': get_jwt_identity(),
        'universe_id': universe_id
    }, room=room)
