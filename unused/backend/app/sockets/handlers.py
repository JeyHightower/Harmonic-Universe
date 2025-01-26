from flask_socketio import emit, join_room, leave_room
from flask_login import current_user
from app.models.universe import Universe
from app.extensions import socketio, db
from datetime import datetime

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    if not current_user.is_authenticated:
        return False

    # Update user's last active timestamp
    current_user.last_active = datetime.utcnow()
    db.session.commit()

    emit('connection_established', {'user_id': current_user.id})
    return True

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    if current_user.is_authenticated:
        # Update user's last active timestamp
        current_user.last_active = datetime.utcnow()
        db.session.commit()

@socketio.on('join_universe')
def handle_join_universe(data):
    """Handle client joining a universe room."""
    if not current_user.is_authenticated:
        return False

    universe_id = data.get('universe_id')
    if not universe_id:
        return False

    # Verify universe exists and user has access
    universe = Universe.query.get(universe_id)
    if not universe or (not universe.is_public and universe.user_id != current_user.id):
        return False

    # Join the room
    room = f'universe_{universe_id}'
    join_room(room)

    # Notify others in the room
    emit('user_joined', {
        'user_id': current_user.id,
        'username': current_user.username
    }, room=room)

    return True

@socketio.on('leave_universe')
def handle_leave_universe(data):
    """Handle client leaving a universe room."""
    if not current_user.is_authenticated:
        return False

    universe_id = data.get('universe_id')
    if not universe_id:
        return False

    # Leave the room
    room = f'universe_{universe_id}'
    leave_room(room)

    # Notify others in the room
    emit('user_left', {
        'user_id': current_user.id,
        'username': current_user.username
    }, room=room)

    return True

@socketio.on('parameter_update')
def handle_parameter_update(data):
    """Handle parameter updates from clients."""
    if not current_user.is_authenticated:
        return False

    universe_id = data.get('universe_id')
    param_type = data.get('type')
    params = data.get('parameters')

    if not all([universe_id, param_type, params]):
        return False

    # Verify universe exists and user has access
    universe = Universe.query.get(universe_id)
    if not universe or universe.user_id != current_user.id:
        return False

    # Update parameters in database
    try:
        parameters = universe.parameters or {}
        parameters[param_type] = params
        universe.parameters = parameters
        db.session.commit()

        # Broadcast update to all clients in the room
        room = f'universe_{universe_id}'
        emit('parameters_updated', {
            'type': param_type,
            'parameters': params,
            'updated_by': {
                'user_id': current_user.id,
                'username': current_user.username
            }
        }, room=room)

        return True
    except Exception:
        db.session.rollback()
        return False

@socketio.on('simulation_start')
def handle_simulation_start(data):
    """Handle simulation start request."""
    if not current_user.is_authenticated:
        return False

    universe_id = data.get('universe_id')
    if not universe_id:
        return False

    # Verify universe exists and user has access
    universe = Universe.query.get(universe_id)
    if not universe or universe.user_id != current_user.id:
        return False

    # Update universe status
    try:
        universe.is_active = True
        universe.last_active = datetime.utcnow()
        db.session.commit()

        # Broadcast to all clients in the room
        room = f'universe_{universe_id}'
        emit('simulation_started', {
            'started_by': {
                'user_id': current_user.id,
                'username': current_user.username
            }
        }, room=room)

        return True
    except Exception:
        db.session.rollback()
        return False

@socketio.on('simulation_stop')
def handle_simulation_stop(data):
    """Handle simulation stop request."""
    if not current_user.is_authenticated:
        return False

    universe_id = data.get('universe_id')
    if not universe_id:
        return False

    # Verify universe exists and user has access
    universe = Universe.query.get(universe_id)
    if not universe or universe.user_id != current_user.id:
        return False

    # Update universe status
    try:
        universe.is_active = False
        universe.last_active = datetime.utcnow()
        db.session.commit()

        # Broadcast to all clients in the room
        room = f'universe_{universe_id}'
        emit('simulation_stopped', {
            'stopped_by': {
                'user_id': current_user.id,
                'username': current_user.username
            }
        }, room=room)

        return True
    except Exception:
        db.session.rollback()
        return False

@socketio.on('simulation_reset')
def handle_simulation_reset(data):
    """Handle simulation reset request."""
    if not current_user.is_authenticated:
        return False

    universe_id = data.get('universe_id')
    if not universe_id:
        return False

    # Verify universe exists and user has access
    universe = Universe.query.get(universe_id)
    if not universe or universe.user_id != current_user.id:
        return False

    # Reset simulation state
    try:
        universe.is_active = False
        universe.last_active = datetime.utcnow()
        db.session.commit()

        # Broadcast to all clients in the room
        room = f'universe_{universe_id}'
        emit('simulation_reset', {
            'reset_by': {
                'user_id': current_user.id,
                'username': current_user.username
            }
        }, room=room)

        return True
    except Exception:
        db.session.rollback()
        return False
