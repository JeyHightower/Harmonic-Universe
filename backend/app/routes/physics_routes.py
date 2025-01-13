from flask import Blueprint, jsonify, request, g
from app.routes.utils import login_required
from app.models import PhysicsParameter, Universe
from app import db

physics_bp = Blueprint('physics', __name__)

@physics_bp.route('/universes/<int:universe_id>/physics', methods=['POST'])
@login_required
def add_physics_parameter(universe_id):
    data = request.get_json()
    if not data or 'parameter_name' not in data or 'value' not in data:
        return jsonify({'error': 'Invalid data' }), 400

    universe = Universe.query.get_or_404(universe_id)
    if universe.creator_id != g.current_user.id:
        return jsonify({'error': 'unauthorized'}), 403

    new_parameter = PhysicsParameter(
        universe_id=universe_id,
        parameter_name=data['parameter_name'],
        value=data['value']
    )
    db.session.add(new_parameter)
    db.session.commit()
    return jsonify({'message': 'Physics parameter added successfully'}), 201

@physics_bp.route('/universes/<int:universe_id>/physics', methods=['GET'])
@login_required

def get_physics_parameters(universe_id):
    universe= Universe.query.get_or_404(universe_id)
    if universe.creator_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    parameters = PhysicsParameter.query.filter_by(universe_id=universe_id).all()
    result = [{'id': p.id, 'parameter_name': p.parameter.name, 'value': p.value} for p in parameters]
    return jsonify(result), 200

@physics_bp.route('/universes/<int:universe_id>/physics/<int:parameter_id>', methods=['PUT'])
@login_required
def update_physics_parameter(universe_id, parameter_id):
    data = request.get_json()
    if not data or 'parameter_name' not in data or 'value' not in data:
        return jsonify({'error': 'Invalid Data'}), 400

    parameter = PhysicsParameter.query.get_or_404(parameter_id)
    if parameter.universe_id != universe_id:
        return jsonify({'error': 'Parameter not found in this Universe'}), 404

    universe = Universe.query.get_or_404(universe_id)
    if universe.creator_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    parameter.parameter_name = data['parameter_name']
    parameter.value = data['value']
    db.session.commit()

    return jsonify({'message': 'Physics parameter updated successfully'}), 200

@physics_bp.route('/universes/<int:universe_id>/physics/<int:parameter_id>', methods=['DELETE'])
@login_required
def delete_physics_parameter(universe_id, parameter_id):
    parameter = PhysicsParameter.query.get_or_404(parameter_id)
    if parameter.universe_id != universe_id:
        return jsonify({'error': 'Parameter not found in this Universe'}), 404

    universe = Universe.query.get_or_404(universe_id)
    if universe.creator_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(parameter)
    db.session.commit()

    return jsonify({'message': 'Physics parameter deleted successfully'}), 200
