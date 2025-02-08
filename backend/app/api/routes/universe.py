"""Universe routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.core.universe import Universe
from app.models.core.user import User
from app.core.errors import ValidationError, AuthenticationError, AuthorizationError
from app.db.session import get_db
from app import socketio
from app.core.auth import require_auth

universe_bp = Blueprint('universe', __name__)

@universe_bp.route('/', methods=['GET'])
@jwt_required()
def get_universes():
    """Get all universes for the current user."""
    current_user_id = get_jwt_identity()
    with get_db() as db:
        universes = db.query(Universe).filter_by(user_id=current_user_id).all()
        return jsonify([universe.to_dict() for universe in universes])

@universe_bp.route('/', methods=['POST'])
@jwt_required()
def create_universe():
    """Create a new universe."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not all(k in data for k in ('name',)):
        raise ValidationError('Missing required fields')

    with get_db() as db:
        universe = Universe(
            name=data['name'],
            description=data.get('description', ''),
            user_id=current_user_id,
            settings=data.get('settings', {})
        )
        universe.save(db)
        return jsonify(universe.to_dict()), 201

@universe_bp.route('/<uuid:universe_id>', methods=['GET'])
@jwt_required()
def get_universe(universe_id):
    """Get a specific universe."""
    current_user_id = get_jwt_identity()
    with get_db() as db:
        universe = Universe.get_by_id(db, universe_id)
        if not universe:
            raise ValidationError('Universe not found')
        if universe.user_id != current_user_id:
            raise AuthorizationError('Not authorized to access this universe')
        return jsonify(universe.to_dict())

@universe_bp.route('/<uuid:universe_id>', methods=['PUT'])
@jwt_required()
def update_universe(universe_id):
    """Update a universe."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    with get_db() as db:
        universe = Universe.get_by_id(db, universe_id)
        if not universe:
            raise ValidationError('Universe not found')
        if universe.user_id != current_user_id:
            raise AuthorizationError('Not authorized to modify this universe')

        allowed_fields = {'name', 'description', 'settings'}
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        for key, value in update_data.items():
            setattr(universe, key, value)
        universe.save(db)

        return jsonify(universe.to_dict())

@universe_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_universe(id):
    with get_db() as db:
        universe = Universe.get_by_id(db, id)
        if not universe:
            raise NotFoundError('Universe not found')
        universe.delete(db)
        return '', 204

@universe_bp.route('/<int:universe_id>/physics', methods=['PUT'])
@jwt_required()
def update_physics(universe_id):
    current_user_id = get_jwt_identity()

    with get_db() as db:
        universe = Universe.get_by_id(db, universe_id)
        if not universe:
            raise NotFoundError('Universe not found')

        if universe.user_id != current_user_id:
            raise AuthorizationError('Not authorized to update this universe')

        data = request.get_json()
        universe.update_physics(data)
        universe.save(db)

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

    with get_db() as db:
        universe = Universe.get_by_id(db, universe_id)
        if not universe:
            raise NotFoundError('Universe not found')

        if universe.user_id != current_user_id:
            raise AuthorizationError('Not authorized to update this universe')

        data = request.get_json()
        universe.update_harmony(data)
        universe.save(db)

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

    with get_db() as db:
        universe = Universe.get_by_id(db, universe_id)
        if not universe:
            raise NotFoundError('Universe not found')

        if universe.user_id != current_user_id:
            raise AuthorizationError('Not authorized to update this universe')

        data = request.get_json()
        if not all(k in data for k in ('title', 'description')):
            raise ValidationError('Missing required fields')

        universe.add_story_point(data)
        universe.save(db)

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

    with get_db() as db:
        universe = Universe.get_by_id(db, universe_id)
        if not universe:
            raise NotFoundError('Universe not found')

        if universe.user_id != current_user_id:
            raise AuthorizationError('Not authorized to update this universe')

        universe.remove_story_point(point_id)
        universe.save(db)

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
