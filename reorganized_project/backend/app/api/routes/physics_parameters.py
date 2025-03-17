from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.app import db
from app.models.physics.physics_parameter import PhysicsParameter
from app.models.physics.physics_object import PhysicsObject
from app.models.universe.universe import Universe

physics_parameters_routes = Blueprint('physics_parameters_routes', __name__)

@physics_parameters_routes.route('', methods=['GET'])
def get_all_physics_parameters():
    """Get all physics parameters, optionally filtered by physics_object_id"""
    physics_object_id = request.args.get('physics_object_id', type=int)
    
    if physics_object_id:
        parameters = PhysicsParameter.query.filter_by(physics_object_id=physics_object_id).all()
    else:
        parameters = PhysicsParameter.query.all()
    
    return jsonify({
        'physics_parameters': [param.to_dict() for param in parameters]
    }), 200

@physics_parameters_routes.route('/<int:parameter_id>', methods=['GET'])
def get_physics_parameter(parameter_id):
    """Get a specific physics parameter by ID"""
    parameter = PhysicsParameter.query.get(parameter_id)
    
    if not parameter:
        return jsonify({'error': 'Physics parameter not found'}), 404
    
    return jsonify(parameter.to_dict()), 200

@physics_parameters_routes.route('', methods=['POST'])
@jwt_required()
def create_physics_parameter():
    """Create a new physics parameter"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    if not data.get('parameter_type'):
        return jsonify({'error': 'Parameter type is required'}), 400
    if not data.get('physics_object_id'):
        return jsonify({'error': 'Physics object ID is required'}), 400
    if 'value' not in data:
        return jsonify({'error': 'Value is required'}), 400
    
    # Check if physics object exists
    physics_object = PhysicsObject.query.get(data.get('physics_object_id'))
    if not physics_object:
        return jsonify({'error': 'Physics object not found'}), 404
    
    # Get the universe to check ownership
    universe = Universe.query.get(physics_object.universe_id)
    if not universe:
        return jsonify({'error': 'Universe not found'}), 404
    
    # Get the current user ID from JWT
    current_user_id = get_jwt_identity()
    
    # Check if user owns the universe
    if universe.creator_id != current_user_id:
        return jsonify({'error': 'Unauthorized to add parameters to objects in this universe'}), 403
    
    # Create new physics parameter
    new_parameter = PhysicsParameter(
        name=data.get('name'),
        description=data.get('description', ''),
        parameter_type=data.get('parameter_type'),
        physics_object_id=data.get('physics_object_id'),
        value=data.get('value'),
        min_value=data.get('min_value'),
        max_value=data.get('max_value'),
        unit=data.get('unit', ''),
        affects_harmony=data.get('affects_harmony', False),
        harmony_weight=data.get('harmony_weight', 1.0)
    )
    
    # Add to database
    db.session.add(new_parameter)
    db.session.commit()
    
    return jsonify(new_parameter.to_dict()), 201

@physics_parameters_routes.route('/<int:parameter_id>', methods=['PUT'])
@jwt_required()
def update_physics_parameter(parameter_id):
    """Update an existing physics parameter"""
    parameter = PhysicsParameter.query.get(parameter_id)
    
    if not parameter:
        return jsonify({'error': 'Physics parameter not found'}), 404
    
    # Get the physics object to check ownership
    physics_object = PhysicsObject.query.get(parameter.physics_object_id)
    if not physics_object:
        return jsonify({'error': 'Physics object not found'}), 404
    
    # Get the universe to check ownership
    universe = Universe.query.get(physics_object.universe_id)
    if not universe:
        return jsonify({'error': 'Universe not found'}), 404
    
    # Check ownership
    current_user_id = get_jwt_identity()
    if universe.creator_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get data from request
    data = request.get_json()
    
    # Update physics parameter attributes
    if 'name' in data:
        parameter.name = data['name']
    if 'description' in data:
        parameter.description = data['description']
    if 'parameter_type' in data:
        parameter.parameter_type = data['parameter_type']
    if 'value' in data:
        parameter.value = data['value']
    if 'min_value' in data:
        parameter.min_value = data['min_value']
    if 'max_value' in data:
        parameter.max_value = data['max_value']
    if 'unit' in data:
        parameter.unit = data['unit']
    if 'affects_harmony' in data:
        parameter.affects_harmony = data['affects_harmony']
    if 'harmony_weight' in data:
        parameter.harmony_weight = data['harmony_weight']
    
    # Save changes
    db.session.commit()
    
    return jsonify(parameter.to_dict()), 200

@physics_parameters_routes.route('/<int:parameter_id>', methods=['DELETE'])
@jwt_required()
def delete_physics_parameter(parameter_id):
    """Delete a physics parameter"""
    parameter = PhysicsParameter.query.get(parameter_id)
    
    if not parameter:
        return jsonify({'error': 'Physics parameter not found'}), 404
    
    # Get the physics object to check ownership
    physics_object = PhysicsObject.query.get(parameter.physics_object_id)
    if not physics_object:
        return jsonify({'error': 'Physics object not found'}), 404
    
    # Get the universe to check ownership
    universe = Universe.query.get(physics_object.universe_id)
    if not universe:
        return jsonify({'error': 'Universe not found'}), 404
    
    # Check ownership
    current_user_id = get_jwt_identity()
    if universe.creator_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Delete the physics parameter
    db.session.delete(parameter)
    db.session.commit()
    
    return jsonify({'message': 'Physics parameter deleted successfully'}), 200
