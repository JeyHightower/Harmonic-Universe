from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from ..models.universe import Universe
from .. import db, socketio

universe_bp = Blueprint('universe', __name__)

@universe_bp.route('/', methods=['POST'])
@login_required
def create_universe():
    data = request.get_json()
    universe = Universe(
        name=data['name'],
        description=data.get('description', ''),
        max_participants=data.get('maxParticipants', 10),
        owner_id=current_user.id,
        parameters={
            'physics': data.get('physics', {}),
            'music': data.get('music', {}),
            'visual': data.get('visual', {})
        }
    )

    db.session.add(universe)
    db.session.commit()

    return jsonify(universe.to_dict()), 201

@universe_bp.route('/')
@login_required
def list_universes():
    universes = Universe.query.filter(
        (Universe.owner_id == current_user.id) |
        (Universe.collaborators.any(id=current_user.id))
    ).all()
    return jsonify([u.to_dict() for u in universes]), 200

@universe_bp.route('/<int:id>')
@login_required
def get_universe(id):
    universe = Universe.query.get_or_404(id)
    if not universe.can_access(current_user):
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(universe.to_dict()), 200

@universe_bp.route('/<int:id>', methods=['PUT'])
@login_required
def update_universe(id):
    universe = Universe.query.get_or_404(id)
    if not universe.can_modify(current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    universe.name = data.get('name', universe.name)
    universe.description = data.get('description', universe.description)
    universe.max_participants = data.get('maxParticipants', universe.max_participants)

    if 'parameters' in data:
        universe.parameters.update(data['parameters'])

    db.session.commit()
    socketio.emit('universe_updated', universe.to_dict(), room=f'universe_{id}')
    return jsonify(universe.to_dict()), 200

@universe_bp.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_universe(id):
    universe = Universe.query.get_or_404(id)
    if not universe.can_modify(current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(universe)
    db.session.commit()
    socketio.emit('universe_deleted', {'id': id}, room=f'universe_{id}')
    return '', 204

@universe_bp.route('/<int:id>/parameters', methods=['PATCH'])
@login_required
def update_parameters(id):
    universe = Universe.query.get_or_404(id)
    if not universe.can_modify(current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    param_type = data.get('type')
    parameters = data.get('parameters', {})

    if param_type not in ['physics', 'music', 'visual']:
        return jsonify({'error': 'Invalid parameter type'}), 400

    universe.parameters[param_type] = parameters
    db.session.commit()

    socketio.emit('parameters_updated', {
        'universe_id': id,
        'type': param_type,
        'parameters': parameters
    }, room=f'universe_{id}')

    return jsonify(universe.parameters), 200

@universe_bp.route('/<int:id>/collaborators', methods=['POST'])
@login_required
def add_collaborator(id):
    universe = Universe.query.get_or_404(id)
    if not universe.can_modify(current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    user_id = data.get('user_id')

    if user_id == current_user.id:
        return jsonify({'error': 'Cannot add yourself as collaborator'}), 400

    from ..models.user import User
    user = User.query.get_or_404(user_id)

    if user in universe.collaborators:
        return jsonify({'error': 'User is already a collaborator'}), 400

    universe.collaborators.append(user)
    db.session.commit()

    socketio.emit('collaborator_added', {
        'universe_id': id,
        'user': user.to_dict()
    }, room=f'universe_{id}')

    return jsonify(universe.to_dict()), 200

@universe_bp.route('/<int:id>/collaborators/<int:user_id>', methods=['DELETE'])
@login_required
def remove_collaborator(id, user_id):
    universe = Universe.query.get_or_404(id)
    if not universe.can_modify(current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    from ..models.user import User
    user = User.query.get_or_404(user_id)

    if user not in universe.collaborators:
        return jsonify({'error': 'User is not a collaborator'}), 400

    universe.collaborators.remove(user)
    db.session.commit()

    socketio.emit('collaborator_removed', {
        'universe_id': id,
        'user_id': user_id
    }, room=f'universe_{id}')

    return '', 204
