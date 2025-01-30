from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import socketio
from ..models import User, Universe, Activity, RealtimeState
from .. import db
from datetime import datetime

@socketio.on('join')
@jwt_required()
def on_join(data):
    """Handle user joining a universe room"""
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    universe = Universe.query.get(universe_id)

    if not universe or not user:
        return

    # Join the room
    room = f"universe_{universe_id}"
    join_room(room)

    # Update realtime state
    state = RealtimeState.query.filter_by(
        user_id=user_id,
        universe_id=universe_id
    ).first()

    if not state:
        state = RealtimeState(
            user_id=user_id,
            universe_id=universe_id
        )
        db.session.add(state)

    state.last_updated = datetime.utcnow()
    db.session.commit()

    # Notify others
    emit('user_joined', {
        'user_id': user_id,
        'username': user.username
    }, room=room, include_self=False)

@socketio.on('leave')
@jwt_required()
def on_leave(data):
    """Handle user leaving a universe room"""
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    user_id = get_jwt_identity()
    room = f"universe_{universe_id}"
    leave_room(room)

    # Notify others
    emit('user_left', {
        'user_id': user_id
    }, room=room)

@socketio.on('cursor_move')
@jwt_required()
def on_cursor_move(data):
    """Handle cursor position updates"""
    universe_id = data.get('universe_id')
    position = data.get('position')
    if not universe_id or not position:
        return

    user_id = get_jwt_identity()
    room = f"universe_{universe_id}"

    # Update realtime state
    state = RealtimeState.query.filter_by(
        user_id=user_id,
        universe_id=universe_id
    ).first()

    if state:
        state.cursor_position = position
        state.last_updated = datetime.utcnow()
        db.session.commit()

    # Broadcast to others
    emit('cursor_update', {
        'user_id': user_id,
        'position': position
    }, room=room, include_self=False)

@socketio.on('activity')
@jwt_required()
def on_activity(data):
    """Handle new activity events"""
    universe_id = data.get('universe_id')
    action = data.get('action')
    target = data.get('target')
    details = data.get('details')

    if not all([universe_id, action, target]):
        return

    user_id = get_jwt_identity()
    room = f"universe_{universe_id}"

    # Create activity record
    activity = Activity(
        universe_id=universe_id,
        user_id=user_id,
        action=action,
        target=target,
        details=details,
        timestamp=datetime.utcnow()
    )
    db.session.add(activity)
    db.session.commit()

    # Broadcast to room
    emit('new_activity', {
        'user_id': user_id,
        'action': action,
        'target': target,
        'details': details,
        'timestamp': activity.timestamp.isoformat()
    }, room=room)
