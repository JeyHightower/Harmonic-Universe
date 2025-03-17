from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.app import db
from app.models.physics.physics_object import PhysicsObject
from app.models.universe.scene import Scene
from app.models.universe.universe import Universe

physics_objects_routes = Blueprint('physics_objects_routes', __name__)

@physics_objects_routes.route('', methods=['GET'])
def get_all_physics_objects():
    """Get all physics objects, optionally filtered by universe_id or scene_id"""
    universe_id = request.args.get('universe_id', type=int)
    scene_id = request.args.get('scene_id', type=int)
    
    if scene_id:
        objects = PhysicsObject.query.filter_by(scene_id=scene_id).all()
    elif universe_id:
        objects = PhysicsObject.query.filter_by(universe_id=universe_id).all()
    else:
        objects = PhysicsObject.query.all()
    
    return jsonify({
        'physics_objects': [obj.to_dict() for obj in objects]
    }), 200

@physics_objects_routes.route('/<int:object_id>', methods=['GET'])
def get_physics_object(object_id):
    """Get a specific physics object by ID"""
    physics_object = PhysicsObject.query.get(object_id)
    
    if not physics_object:
        return jsonify({'error': 'Physics object not found'}), 404
    
    # Check if detailed view is requested
    if request.args.get('detailed') == 'true':
        return jsonify(physics_object.to_dict_with_parameters()), 200
    else:
        return jsonify(physics_object.to_dict()), 200

@physics_objects_routes.route('', methods=['POST'])
@jwt_required()
def create_physics_object():
    """Create a new physics object"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    if not data.get('object_type'):
        return jsonify({'error': 'Object type is required'}), 400
    if not data.get('universe_id'):
        return jsonify({'error': 'Universe ID is required'}), 400
    
    # Check if universe exists
    universe = Universe.query.get(data.get('universe_id'))
    if not universe:
        return jsonify({'error': 'Universe not found'}), 404
    
    # Get the current user ID from JWT
    current_user_id = get_jwt_identity()
    
    # Check if user owns the universe
    if universe.creator_id != current_user_id:
        return jsonify({'error': 'Unauthorized to add objects to this universe'}), 403
    
    # Check if scene exists if scene_id is provided
    scene_id = data.get('scene_id')
    if scene_id:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404
        if scene.universe_id != data.get('universe_id'):
            return jsonify({'error': 'Scene does not belong to the specified universe'}), 400
    
    # Create new physics object
    new_object = PhysicsObject(
        name=data.get('name'),
        description=data.get('description', ''),
        object_type=data.get('object_type'),
        universe_id=data.get('universe_id'),
        scene_id=data.get('scene_id'),
        position=data.get('position', '{"x": 0, "y": 0, "z": 0}'),
        rotation=data.get('rotation', '{"x": 0, "y": 0, "z": 0}'),
        scale=data.get('scale', '{"x": 1, "y": 1, "z": 1}'),
        mass=data.get('mass', 1.0),
        is_static=data.get('is_static', False),
        color=data.get('color', '#FFFFFF'),
        model_url=data.get('model_url', '')
    )
    
    # Add to database
    db.session.add(new_object)
    db.session.commit()
    
    return jsonify(new_object.to_dict()), 201

@physics_objects_routes.route('/<int:object_id>', methods=['PUT'])
@jwt_required()
def update_physics_object(object_id):
    """Update an existing physics object"""
    physics_object = PhysicsObject.query.get(object_id)
    
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
    
    # Update physics object attributes
    if 'name' in data:
        physics_object.name = data['name']
    if 'description' in data:
        physics_object.description = data['description']
    if 'object_type' in data:
        physics_object.object_type = data['object_type']
    if 'scene_id' in data:
        # Verify scene belongs to the same universe
        if data['scene_id']:
            scene = Scene.query.get(data['scene_id'])
            if not scene:
                return jsonify({'error': 'Scene not found'}), 404
            if scene.universe_id != physics_object.universe_id:
                return jsonify({'error': 'Scene does not belong to the object\'s universe'}), 400
        physics_object.scene_id = data['scene_id']
    if 'position' in data:
        physics_object.position = data['position']
    if 'rotation' in data:
        physics_object.rotation = data['rotation']
    if 'scale' in data:
        physics_object.scale = data['scale']
    if 'mass' in data:
        physics_object.mass = data['mass']
    if 'is_static' in data:
        physics_object.is_static = data['is_static']
    if 'color' in data:
        physics_object.color = data['color']
    if 'model_url' in data:
        physics_object.model_url = data['model_url']
    
    # Save changes
    db.session.commit()
    
    return jsonify(physics_object.to_dict()), 200

@physics_objects_routes.route('/<int:object_id>', methods=['DELETE'])
@jwt_required()
def delete_physics_object(object_id):
    """Delete a physics object"""
    physics_object = PhysicsObject.query.get(object_id)
    
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
    
    # Delete the physics object (cascade will handle related entities)
    db.session.delete(physics_object)
    db.session.commit()
    
    return jsonify({'message': 'Physics object deleted successfully'}), 200
