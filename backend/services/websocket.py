from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_login import current_user
from ..models import Universe

socketio = SocketIO()

def init_socketio(app):
    """Initialize SocketIO with the app"""
    socketio.init_app(app, cors_allowed_origins="*")
    return socketio

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
    if not universe or not universe.can_access(current_user):
        return

    room = f'universe_{universe_id}'
    join_room(room)
    emit('user_joined', {
        'user': current_user.to_dict(),
        'universe_id': universe_id
    }, room=room)

@socketio.on('leave_universe')
def handle_leave_universe(data):
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    room = f'universe_{universe_id}'
    leave_room(room)
    emit('user_left', {
        'user': current_user.to_dict(),
        'universe_id': universe_id
    }, room=room)

@socketio.on('start_simulation')
def handle_start_simulation(data):
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    universe = Universe.query.get(universe_id)
    if not universe or not universe.can_modify(current_user):
        return

    room = f'universe_{universe_id}'
    emit('simulation_started', {
        'universe_id': universe_id,
        'started_by': current_user.to_dict()
    }, room=room)

@socketio.on('stop_simulation')
def handle_stop_simulation(data):
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    universe = Universe.query.get(universe_id)
    if not universe or not universe.can_modify(current_user):
        return

    room = f'universe_{universe_id}'
    emit('simulation_stopped', {
        'universe_id': universe_id,
        'stopped_by': current_user.to_dict()
    }, room=room)

@socketio.on('reset_simulation')
def handle_reset_simulation(data):
    universe_id = data.get('universe_id')
    if not universe_id:
        return

    universe = Universe.query.get(universe_id)
    if not universe or not universe.can_modify(current_user):
        return

    room = f'universe_{universe_id}'
    emit('simulation_reset', {
        'universe_id': universe_id,
        'reset_by': current_user.to_dict()
    }, room=room)

@socketio.on('parameter_update')
def handle_parameter_update(data):
    universe_id = data.get('universe_id')
    param_type = data.get('type')
    parameters = data.get('parameters')

    if not universe_id or not param_type or not parameters:
        return

    universe = Universe.query.get(universe_id)
    if not universe or not universe.can_modify(current_user):
        return

    room = f'universe_{universe_id}'
    emit('parameters_updated', {
        'universe_id': universe_id,
        'type': param_type,
        'parameters': parameters,
        'updated_by': current_user.to_dict()
    }, room=room)

