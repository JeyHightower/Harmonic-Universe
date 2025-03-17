from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.app import db
from app.models.universe.scene import Scene
from app.models.universe.universe import Universe

scene_routes = Blueprint('scene_routes', __name__)

@scene_routes.route('', methods=['GET'])
def get_all_scenes():
    """Get all scenes, optionally filtered by universe_id"""
    universe_id = request.args.get('universe_id', type=int)
    
    if universe_id:
        scenes = Scene.query.filter_by(universe_id=universe_id).all()
    else:
        scenes = Scene.query.all()
    
    return jsonify({
        'scenes': [scene.to_dict() for scene in scenes]
    }), 200

@scene_routes.route('/<int:scene_id>', methods=['GET'])
def get_scene(scene_id):
    """Get a specific scene by ID"""
    scene = Scene.query.get(scene_id)
    
    if not scene:
        return jsonify({'error': 'Scene not found'}), 404
    
    # Check if detailed view is requested
    if request.args.get('detailed') == 'true':
        return jsonify(scene.to_dict_with_objects()), 200
    else:
        return jsonify(scene.to_dict()), 200

@scene_routes.route('', methods=['POST'])
@jwt_required()
def create_scene():
    """Create a new scene"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
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
        return jsonify({'error': 'Unauthorized to add scenes to this universe'}), 403
    
    # Create new scene
    new_scene = Scene(
        name=data.get('name'),
        description=data.get('description', ''),
        universe_id=data.get('universe_id'),
        creator_id=current_user_id,
        thumbnail_url=data.get('thumbnail_url', ''),
        position=data.get('position', 0),
        is_active=data.get('is_active', True)
    )
    
    # Add to database
    db.session.add(new_scene)
    db.session.commit()
    
    return jsonify(new_scene.to_dict()), 201

@scene_routes.route('/<int:scene_id>', methods=['PUT'])
@jwt_required()
def update_scene(scene_id):
    """Update an existing scene"""
    scene = Scene.query.get(scene_id)
    
    if not scene:
        return jsonify({'error': 'Scene not found'}), 404
    
    # Check ownership
    current_user_id = get_jwt_identity()
    if scene.creator_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get data from request
    data = request.get_json()
    
    # Update scene attributes
    if 'name' in data:
        scene.name = data['name']
    if 'description' in data:
        scene.description = data['description']
    if 'thumbnail_url' in data:
        scene.thumbnail_url = data['thumbnail_url']
    if 'position' in data:
        scene.position = data['position']
    if 'is_active' in data:
        scene.is_active = data['is_active']
    
    # Save changes
    db.session.commit()
    
    return jsonify(scene.to_dict()), 200

@scene_routes.route('/<int:scene_id>', methods=['DELETE'])
@jwt_required()
def delete_scene(scene_id):
    """Delete a scene"""
    scene = Scene.query.get(scene_id)
    
    if not scene:
        return jsonify({'error': 'Scene not found'}), 404
    
    # Check ownership
    current_user_id = get_jwt_identity()
    if scene.creator_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Delete the scene (cascade will handle related entities)
    db.session.delete(scene)
    db.session.commit()
    
    return jsonify({'message': 'Scene deleted successfully'}), 200
