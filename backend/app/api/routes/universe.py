"""Universe routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.universe.universe import Universe
from app.models.user import User
from app.core.errors import ValidationError, AuthenticationError, AuthorizationError
from app.db.session import get_db
from app import socketio
from app.core.auth import require_auth
from datetime import datetime

universe_bp = Blueprint('universe', __name__)

@universe_bp.route('/', methods=['GET'])
@jwt_required()
def get_universes():
    """Get all universes for the current user."""
    current_user_id = get_jwt_identity()
    with get_db() as db:
        try:
            universes = db.query(Universe).filter_by(user_id=current_user_id).all()
            db.commit()
            return jsonify([universe.to_dict() for universe in universes])
        except Exception as e:
            db.rollback()
            raise ValidationError(f"Error fetching universes: {str(e)}")

@universe_bp.route('/', methods=['POST'])
@jwt_required()
def create_universe():
    """Create a new universe."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not all(k in data for k in ('name',)):
        raise ValidationError('Missing required fields')

    with get_db() as db:
        try:
            universe = Universe(
                name=data['name'],
                description=data.get('description', ''),
                user_id=current_user_id,
                settings=data.get('settings', {})
            )
            db.add(universe)
            db.commit()
            return jsonify(universe.to_dict()), 201
        except Exception as e:
            db.rollback()
            raise ValidationError(f"Error creating universe: {str(e)}")

@universe_bp.route('/<uuid:universe_id>', methods=['GET'])
@jwt_required()
def get_universe(universe_id):
    """Get a specific universe."""
    current_user_id = get_jwt_identity()

    with get_db() as db:
        try:
            # Get the universe and user in a single query
            universe = db.query(Universe).filter_by(id=universe_id).first()

            if not universe:
                raise ValidationError('Universe not found')

            # Check if user has access (owner or public universe)
            if not (universe.is_public or str(universe.user_id) == str(current_user_id)):
                raise AuthorizationError('Not authorized to access this universe')

            # Get user's role and permissions if they exist
            user_role = None
            if str(universe.user_id) == str(current_user_id):
                user_role = 'owner'

            # Add role to response
            response_data = universe.to_dict()
            response_data['user_role'] = user_role

            db.commit()
            return jsonify(response_data)

        except (ValidationError, AuthorizationError) as e:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise ValidationError(f"Error fetching universe: {str(e)}")

@universe_bp.route('/<uuid:universe_id>', methods=['PUT'])
@jwt_required()
def update_universe(universe_id):
    """Update a universe."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    with get_db() as db:
        try:
            universe = Universe.get_by_id(db, universe_id)
            if not universe:
                raise ValidationError('Universe not found')
            if universe.user_id != current_user_id:
                raise AuthorizationError('Not authorized to modify this universe')

            allowed_fields = {'name', 'description', 'settings'}
            update_data = {k: v for k, v in data.items() if k in allowed_fields}

            for key, value in update_data.items():
                setattr(universe, key, value)

            db.add(universe)
            db.commit()
            return jsonify(universe.to_dict())
        except (ValidationError, AuthorizationError) as e:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise ValidationError(f"Error updating universe: {str(e)}")

@universe_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_universe(id):
    with get_db() as db:
        try:
            universe = Universe.get_by_id(db, id)
            if not universe:
                raise ValidationError('Universe not found')
            db.delete(universe)
            db.commit()
            return '', 204
        except ValidationError as e:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise ValidationError(f"Error deleting universe: {str(e)}")

@universe_bp.route('/<int:universe_id>/physics', methods=['PUT'])
@jwt_required()
def update_physics(universe_id):
    current_user_id = get_jwt_identity()

    with get_db() as db:
        try:
            universe = Universe.get_by_id(db, universe_id)
            if not universe:
                raise ValidationError('Universe not found')

            if universe.user_id != current_user_id:
                raise AuthorizationError('Not authorized to update this universe')

            data = request.get_json()
            universe.update_physics(data)
            db.add(universe)
            db.commit()

            # Notify connected clients about the physics update
            socketio.emit('physics_changed', {
                'universe_id': universe_id,
                'parameters': universe.physics_params
            }, room=f'universe_{universe_id}')

            return jsonify(universe.to_dict())
        except (ValidationError, AuthorizationError) as e:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise ValidationError(f"Error updating physics: {str(e)}")

@universe_bp.route('/<int:universe_id>/harmony', methods=['PUT'])
@jwt_required()
def update_harmony(universe_id):
    current_user_id = get_jwt_identity()

    with get_db() as db:
        try:
            universe = Universe.get_by_id(db, universe_id)
            if not universe:
                raise ValidationError('Universe not found')

            if universe.user_id != current_user_id:
                raise AuthorizationError('Not authorized to update this universe')

            data = request.get_json()
            universe.update_harmony(data)
            db.add(universe)
            db.commit()

            # Notify connected clients about the harmony update
            socketio.emit('harmony_changed', {
                'universe_id': universe_id,
                'parameters': universe.harmony_params
            }, room=f'universe_{universe_id}')

            return jsonify(universe.to_dict())
        except (ValidationError, AuthorizationError) as e:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise ValidationError(f"Error updating harmony: {str(e)}")

@universe_bp.route('/<int:universe_id>/story-points', methods=['POST'])
@jwt_required()
def add_story_point(universe_id):
    current_user_id = get_jwt_identity()

    with get_db() as db:
        try:
            universe = Universe.get_by_id(db, universe_id)
            if not universe:
                raise ValidationError('Universe not found')

            if universe.user_id != current_user_id:
                raise AuthorizationError('Not authorized to update this universe')

            data = request.get_json()
            if not all(k in data for k in ('title', 'description')):
                raise ValidationError('Missing required fields')

            universe.add_story_point(data)
            db.add(universe)
            db.commit()

            # Notify connected clients about the new story point
            socketio.emit('story_changed', {
                'universe_id': universe_id,
                'story_points': universe.story_points
            }, room=f'universe_{universe_id}')

            return jsonify(universe.to_dict())
        except (ValidationError, AuthorizationError) as e:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise ValidationError(f"Error adding story point: {str(e)}")

@universe_bp.route('/<int:universe_id>/story-points/<int:point_id>', methods=['DELETE'])
@jwt_required()
def remove_story_point(universe_id, point_id):
    current_user_id = get_jwt_identity()

    with get_db() as db:
        try:
            universe = Universe.get_by_id(db, universe_id)
            if not universe:
                raise ValidationError('Universe not found')

            if universe.user_id != current_user_id:
                raise AuthorizationError('Not authorized to update this universe')

            universe.remove_story_point(point_id)
            db.add(universe)
            db.commit()

            # Notify connected clients about the story point removal
            socketio.emit('story_changed', {
                'universe_id': universe_id,
                'story_points': universe.story_points
            }, room=f'universe_{universe_id}')

            return '', 204
        except (ValidationError, AuthorizationError) as e:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise ValidationError(f"Error removing story point: {str(e)}")

# WebSocket event handlers
@socketio.on('join_universe')
def on_join_universe(data):
    """Join a universe room."""
    try:
        # Get token from socket auth or data
        token = None
        if hasattr(request, 'headers') and 'Authorization' in request.headers:
            token = request.headers['Authorization'].replace('Bearer ', '')
        elif 'token' in data:
            token = data['token']

        if not token:
            raise AuthenticationError('No authentication token provided')

        # Verify token
        try:
            from flask_jwt_extended import decode_token
            decoded_token = decode_token(token)
            current_user_id = decoded_token['sub']
        except Exception as e:
            raise AuthenticationError(f'Invalid token: {str(e)}')

        universe_id = data.get('universe_id')
        if not universe_id:
            raise ValidationError('Universe ID is required')

        with get_db() as db:
            universe = db.query(Universe).filter_by(id=universe_id).first()

            if not universe:
                raise ValidationError('Universe not found')

            # Check if user has access
            if not (universe.is_public or str(universe.user_id) == str(current_user_id)):
                raise AuthorizationError('Not authorized to access this universe')

            room = f'universe_{universe_id}'
            socketio.join_room(room)

            # Emit join event to room
            socketio.emit('user_joined', {
                'user_id': current_user_id,
                'universe_id': universe_id,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room)

    except Exception as e:
        error_msg = str(e)
        socketio.emit('error', {
            'message': error_msg,
            'code': 'join_failed'
        }, room=request.sid)

@socketio.on('leave_universe')
def on_leave_universe(data):
    """Leave a universe room."""
    try:
        # Get token from socket auth or data
        token = None
        if hasattr(request, 'headers') and 'Authorization' in request.headers:
            token = request.headers['Authorization'].replace('Bearer ', '')
        elif 'token' in data:
            token = data['token']

        if not token:
            raise AuthenticationError('No authentication token provided')

        # Verify token
        try:
            from flask_jwt_extended import decode_token
            decoded_token = decode_token(token)
            current_user_id = decoded_token['sub']
        except Exception as e:
            raise AuthenticationError(f'Invalid token: {str(e)}')

        universe_id = data.get('universe_id')
        if not universe_id:
            return

        room = f'universe_{universe_id}'
        socketio.leave_room(room)

        # Emit leave event to room
        socketio.emit('user_left', {
            'user_id': current_user_id,
            'universe_id': universe_id,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room)

    except Exception as e:
        error_msg = str(e)
        socketio.emit('error', {
            'message': error_msg,
            'code': 'leave_failed'
        }, room=request.sid)
