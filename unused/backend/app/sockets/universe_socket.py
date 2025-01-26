from flask_socketio import emit, join_room, leave_room
from flask_login import current_user
from app.extensions import socketio
from app.models.universe import Universe

@socketio.on('connect')
def handle_connect():
    if not current_user.is_authenticated:
        return False
    return True

@socketio.on('join_universe')
def handle_join_universe(data):
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    universe = Universe.query.get(universe_id)
    if not universe or universe.user_id != current_user.id:
        return

    room = f'universe_{universe_id}'
    join_room(room)
    emit('universe_joined', {'universe_id': universe_id}, room=room)

@socketio.on('leave_universe')
def handle_leave_universe(data):
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    room = f'universe_{universe_id}'
    leave_room(room)
    emit('universe_left', {'universe_id': universe_id}, room=room)

@socketio.on('parameter_update')
def handle_parameter_update(data):
    universe_id = data.get('universe_id')
    param_type = data.get('type')
    parameters = data.get('parameters')

    if not all([universe_id, param_type, parameters]):
        return

    universe = Universe.query.get(universe_id)
    if not universe or universe.user_id != current_user.id:
        return

    # Update parameters in database
    current_params = universe.parameters or {}
    current_params[param_type] = parameters
    universe.parameters = current_params
    universe.save()

    # Broadcast update to all clients in the universe room
    room = f'universe_{universe_id}'
    emit('parameter_updated', {
        'universe_id': universe_id,
        'type': param_type,
        'parameters': parameters
    }, room=room)

@socketio.on('simulation_start')
def handle_simulation_start(data):
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    universe = Universe.query.get(universe_id)
    if not universe or universe.user_id != current_user.id:
        return

    room = f'universe_{universe_id}'
    emit('simulation_started', {'universe_id': universe_id}, room=room)

@socketio.on('simulation_stop')
def handle_simulation_stop(data):
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    universe = Universe.query.get(universe_id)
    if not universe or universe.user_id != current_user.id:
        return

    room = f'universe_{universe_id}'
    emit('simulation_stopped', {'universe_id': universe_id}, room=room)

@socketio.on('simulation_reset')
def handle_simulation_reset(data):
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    universe = Universe.query.get(universe_id)
    if not universe or universe.user_id != current_user.id:
        return

    room = f'universe_{universe_id}'
    emit('simulation_reset', {'universe_id': universe_id}, room=room)
