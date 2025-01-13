from flask import Blueprint, jsonify, request, g
from app.models.physics_parameter import PhysicsParameter
from app.models.universe import Universe
from app import db
from app.utils.token_manager import auto_token
from werkzeug.exceptions import NotFound

physics_bp = Blueprint('physics', __name__)

@physics_bp.route('/', methods=['POST'])
@auto_token
def add_physics_parameter(universe_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided', 'type': 'validation_error'}), 400

        # Check required fields
        required_fields = ['parameter_name', 'value', 'unit']
        missing_fields = [field for field in required_fields if field not in data or not str(data[field]).strip()]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'type': 'validation_error'
            }), 400

        # Validate parameter name
        parameter_name = data['parameter_name'].strip()
        if len(parameter_name) < 2 or len(parameter_name) > 50:
            return jsonify({
                'error': 'Parameter name must be between 2 and 50 characters',
                'type': 'validation_error'
            }), 400

        # Validate value (must be a number)
        value = data['value']
        if not isinstance(value, (int, float)):
            return jsonify({
                'error': 'Value must be a number',
                'type': 'validation_error'
            }), 400

        # Validate unit
        unit = data['unit'].strip()
        if len(unit) < 1 or len(unit) > 20:
            return jsonify({
                'error': 'Unit must be between 1 and 20 characters',
                'type': 'validation_error'
            }), 400

        # Check universe exists and authorization
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found', 'type': 'not_found_error'}), 404
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized', 'type': 'authorization_error'}), 403

        new_parameter = PhysicsParameter(
            universe_id=universe_id,
            parameter_name=parameter_name,
            value=value,
            unit=unit
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
        return jsonify({
            'error': 'An error occurred while adding the physics parameter',
            'type': 'server_error',
            'details': str(e)
        }), 500

@physics_bp.route('/', methods=['GET'])
@auto_token
def get_physics_parameters(universe_id):
    try:
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        parameters = PhysicsParameter.query.filter_by(universe_id=universe_id).all()
        result = [{
            'id': p.id,
            'parameter_name': p.parameter_name,
            'value': p.value,
            'unit': p.unit
        } for p in parameters]
        return jsonify({'parameters': result}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@physics_bp.route('/<int:parameter_id>', methods=['PUT'])
@auto_token
def update_physics_parameter(universe_id, parameter_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided', 'type': 'validation_error'}), 400

        # Check required fields
        required_fields = ['parameter_name', 'value', 'unit']
        missing_fields = [field for field in required_fields if field not in data or not str(data[field]).strip()]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'type': 'validation_error'
            }), 400

        # Validate parameter name
        parameter_name = data['parameter_name'].strip()
        if len(parameter_name) < 2 or len(parameter_name) > 50:
            return jsonify({
                'error': 'Parameter name must be between 2 and 50 characters',
                'type': 'validation_error'
            }), 400

        # Validate value
        value = data['value']
        if not isinstance(value, (int, float)):
            return jsonify({
                'error': 'Value must be a number',
                'type': 'validation_error'
            }), 400

        # Validate unit
        unit = data['unit'].strip()
        if len(unit) < 1 or len(unit) > 20:
            return jsonify({
                'error': 'Unit must be between 1 and 20 characters',
                'type': 'validation_error'
            }), 400

        # Check parameter exists and authorization
        parameter = PhysicsParameter.query.get(parameter_id)
        if not parameter:
            return jsonify({'error': 'Parameter not found', 'type': 'not_found_error'}), 404
        if parameter.universe_id != universe_id:
            return jsonify({
                'error': 'Parameter not found in this Universe',
                'type': 'not_found_error'
            }), 404

        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found', 'type': 'not_found_error'}), 404
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized', 'type': 'authorization_error'}), 403

        # Update parameter
        parameter.parameter_name = parameter_name
        parameter.value = value
        parameter.unit = unit
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
        return jsonify({
            'error': 'An error occurred while updating the physics parameter',
            'type': 'server_error',
            'details': str(e)
        }), 500

@physics_bp.route('/<int:parameter_id>', methods=['DELETE'])
@auto_token
def delete_physics_parameter(universe_id, parameter_id):
    try:
        parameter = PhysicsParameter.query.get(parameter_id)
        if not parameter:
            return jsonify({'error': 'Parameter not found'}), 404
        if parameter.universe_id != universe_id:
            return jsonify({'error': 'Parameter not found in this Universe'}), 404

        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        db.session.delete(parameter)
        db.session.commit()
        return jsonify({'message': 'Physics Parameter deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
