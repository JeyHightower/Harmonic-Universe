"""Universe WebSocket handler."""
from flask_socketio import emit, join_room, leave_room
from flask_login import current_user
from ..models import Universe, RealtimeState
from ..extensions import socketio, db
from typing import Dict, Any

@socketio.on('join_universe')
def handle_join_universe(data: Dict[str, Any]):
    """Handle user joining a universe."""
    if not current_user.is_authenticated:
        return emit('error', {'message': 'Authentication required'})

    universe_id = data.get('universe_id')
    if not universe_id:
        return emit('error', {'message': 'Universe ID required'})

    universe = Universe.query.get(universe_id)
    if not universe:
        return emit('error', {'message': 'Universe not found'})

    if not universe.can_user_access(current_user.id):
        return emit('error', {'message': 'Access denied'})

    # Join the universe room
    room = f'universe_{universe_id}'
    join_room(room)

    # Create or update realtime state
    state = RealtimeState.get_user_state(universe_id, current_user.id)
    if not state:
        state = RealtimeState(
            universe_id=universe_id,
            user_id=current_user.id,
            current_view=data.get('current_view')
        )
        db.session.add(state)
    else:
        state.update_state(current_view=data.get('current_view'))

    db.session.commit()

    # Notify others
    emit('user_joined', {
        'user': {
            'id': current_user.id,
            'username': current_user.username
        },
        'current_view': state.current_view
    }, room=room, include_self=False)

    # Send current state to the joining user
    emit('universe_state', {
        'active_users': [
            {
                'id': s.user.id,
                'username': s.user.username,
                'current_view': s.current_view,
                'cursor_position': s.cursor_position,
                'last_updated': s.last_updated.isoformat()
            }
            for s in universe.realtime_states
        ],
        'physics_parameters': universe.physics_parameters.to_dict() if universe.physics_parameters else None
    })

@socketio.on('leave_universe')
def handle_leave_universe(data: Dict[str, Any]):
    """Handle user leaving a universe."""
    if not current_user.is_authenticated:
        return

    universe_id = data.get('universe_id')
    if not universe_id:
        return

    # Leave the universe room
    room = f'universe_{universe_id}'
    leave_room(room)

    # Remove realtime state
    state = RealtimeState.get_user_state(universe_id, current_user.id)
    if state:
        db.session.delete(state)
        db.session.commit()

    # Notify others
    emit('user_left', {
        'user_id': current_user.id
    }, room=room)

@socketio.on('update_physics')
def handle_physics_update(data: Dict[str, Any]):
    """Handle physics parameters update."""
    if not current_user.is_authenticated:
        return emit('error', {'message': 'Authentication required'})

    universe_id = data.get('universe_id')
    if not universe_id:
        return emit('error', {'message': 'Universe ID required'})

    universe = Universe.query.get(universe_id)
    if not universe:
        return emit('error', {'message': 'Universe not found'})

    if not universe.can_user_edit(current_user.id):
        return emit('error', {'message': 'Permission denied'})

    parameters = data.get('parameters', {})
    if universe.physics_parameters:
        try:
            universe.physics_parameters.update(parameters)
            db.session.commit()

            # Broadcast update to all users in the universe
            room = f'universe_{universe_id}'
            emit('physics_updated', {
                'physics_parameters': universe.physics_parameters.to_dict(),
                'updated_by': {
                    'id': current_user.id,
                    'username': current_user.username
                }
            }, room=room)
        except ValueError as e:
            emit('error', {'message': str(e)})
    else:
        emit('error', {'message': 'Physics parameters not found'})

@socketio.on('update_presence')
def handle_presence_update(data: Dict[str, Any]):
    """Handle user presence update."""
    if not current_user.is_authenticated:
        return

    universe_id = data.get('universe_id')
    if not universe_id:
        return

    state = RealtimeState.get_user_state(universe_id, current_user.id)
    if state:
        state.update_state(
            current_view=data.get('current_view'),
            cursor_position=data.get('cursor_position')
        )
        db.session.commit()

        # Broadcast presence update
        room = f'universe_{universe_id}'
        emit('presence_updated', {
            'user_id': current_user.id,
            'current_view': state.current_view,
            'cursor_position': state.cursor_position,
            'last_updated': state.last_updated.isoformat()
        }, room=room, include_self=False)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnect."""
    if not current_user.is_authenticated:
        return

    # Clean up any active states
    states = RealtimeState.query.filter_by(user_id=current_user.id).all()
    for state in states:
        room = f'universe_{state.universe_id}'
        emit('user_left', {
            'user_id': current_user.id
        }, room=room)
        db.session.delete(state)

    db.session.commit()
