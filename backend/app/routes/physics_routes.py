from flask import Blueprint, jsonify, request, g
from app.models.physics_parameter import PhysicsParameter
from app.models.universe import Universe
from app import db
from app.utils.token_manager import auto_token

physics_bp = Blueprint('physics', __name__)

@physics_bp.route('/<int:universe_id>/physics', methods=['POST'])
@auto_token
def add_physics_parameter(universe_id):
    data = request.get_json()
    if not data or 'parameter_name' not in data or 'value' not in data or 'unit' not in data:
        return jsonify({'error': 'Invalid Data'}), 400

    try:
        universe = Universe.query.get_or_404(universe_id)
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        new_parameter = PhysicsParameter(
            universe_id=universe_id,
            parameter_name=data['parameter_name'],
            value=data['value'],
            unit=data['unit']
        )
        db.session.add(new_parameter)
        db.session.commit()

        return jsonify({
            'message': 'Physics parameter added successfully',
            'parameter': {
                'id': new_parameter.id,
                'parameter_name': new_parameter.parameter_name,
                'value': new_parameter.value,
                'unit': new_parameter.unit
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@physics_bp.route('/<int:universe_id>/physics', methods=['GET'])
@auto_token
def get_physics_parameters(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        parameters = PhysicsParameter.query.filter_by(universe_id=universe_id).all()
        result = [{
            'id': p.id,
            'parameter_name': p.parameter_name,
            'value': p.value,
            'unit': p.unit
        } for p in parameters]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@physics_bp.route('/<int:universe_id>/physics/<int:parameter_id>', methods=['PUT'])
@auto_token
def update_physics_parameter(universe_id, parameter_id):
    data = request.get_json()
    if not data or 'parameter_name' not in data or 'value' not in data or 'unit' not in data:
        return jsonify({'error': 'Invalid Data'}), 400

    try:
        parameter = PhysicsParameter.query.get_or_404(parameter_id)
        if parameter.universe_id != universe_id:
            return jsonify({'error': 'Parameter not found in this Universe'}), 404

        universe = Universe.query.get_or_404(universe_id)
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        parameter.parameter_name = data['parameter_name']
        parameter.value = data['value']
        parameter.unit = data['unit']
        db.session.commit()

        return jsonify({
            'message': 'Physics Parameter updated successfully',
            'parameter': {
                'id': parameter.id,
                'parameter_name': parameter.parameter_name,
                'value': parameter.value,
                'unit': parameter.unit
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@physics_bp.route('/<int:universe_id>/physics/<int:parameter_id>', methods=['DELETE'])
@auto_token
def delete_physics_parameter(universe_id, parameter_id):
    try:
        parameter = PhysicsParameter.query.get_or_404(parameter_id)
        if parameter.universe_id != universe_id:
            return jsonify({'error': 'Parameter not found in this Universe'}), 404

        universe = Universe.query.get_or_404(universe_id)
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        db.session.delete(parameter)
        db.session.commit()
        return jsonify({'message': 'Physics Parameter deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
