"""
Scene routes.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.db import db
from app.models.scene import Scene
from app.models.universe import Universe
from app.schemas.scene import Scene, SceneCreate, SceneUpdate, SceneResponse, SceneWithParameters

scenes_bp = Blueprint('scenes', __name__, url_prefix='/scenes')

@scenes_bp.route('', methods=['GET'])
@jwt_required()
def get_scenes():
    """Get all scenes."""
    try:
        scenes = Scene.query.all()
        return jsonify(SceneResponse(many=True).dump(scenes)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@scenes_bp.route('', methods=['POST'])
@jwt_required()
def create_scene():
    """Create new scene."""
    try:
        # Get current user
        creator_id = get_jwt_identity()

        # Validate request data
        data = scene_create_schema.load(request.json)

        # Check if universe exists
        universe = Universe.query.get(data['universe_id'])
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        # Create scene
        scene = Scene(
            name=data['name'],
            description=data.get('description'),
            creator_id=creator_id,
            universe_id=data['universe_id'],
            physics_parameters=data.get('physics_parameters', {}),
            music_parameters=data.get('music_parameters', {})
        )
        db.session.add(scene)
        db.session.commit()

        return jsonify(scene_schema.dump(scene)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@scenes_bp.route('/<uuid:scene_id>', methods=['GET'])
@jwt_required()
def get_scene(scene_id):
    """Get scene by ID."""
    try:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404
        return jsonify(scene_schema.dump(scene)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@scenes_bp.route('/<uuid:scene_id>', methods=['PUT'])
@jwt_required()
def update_scene(scene_id):
    """Update scene."""
    try:
        # Check if scene exists
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        # Check if current user is the creator
        current_user_id = get_jwt_identity()
        if str(scene.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        # Validate and update scene data
        data = scene_update_schema.load(request.json)
        for key, value in data.items():
            setattr(scene, key, value)
        db.session.commit()

        return jsonify(scene_schema.dump(scene)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@scenes_bp.route('/<uuid:scene_id>', methods=['DELETE'])
@jwt_required()
def delete_scene(scene_id):
    """Delete scene."""
    try:
        # Check if scene exists
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        # Check if current user is the creator
        current_user_id = get_jwt_identity()
        if str(scene.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        # Delete scene
        db.session.delete(scene)
        db.session.commit()

        return jsonify({'message': 'Scene deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@scenes_bp.route('/<uuid:scene_id>/parameters', methods=['GET'])
@jwt_required()
def get_scene_parameters(scene_id):
    """Get scene parameters."""
    try:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404
        return jsonify(scene_with_parameters_schema.dump(scene)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
