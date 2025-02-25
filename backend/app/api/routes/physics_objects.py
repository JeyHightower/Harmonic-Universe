"""Physics Object routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.physics.physics_object import PhysicsObject
from app.models.universe.scene import Scene
from app.db.session import get_db
from app.core.errors import ValidationError, NotFoundError, AuthorizationError
from uuid import UUID
import logging

logger = logging.getLogger(__name__)
physics_objects_bp = Blueprint('physics_objects', __name__)

@physics_objects_bp.route('/', methods=['GET'])
@jwt_required()
def get_physics_objects():
    """Get all physics objects for a scene."""
    current_user_id = get_jwt_identity()
    scene_id = request.args.get('scene_id')

    if not scene_id:
        raise ValidationError("scene_id parameter is required")

    try:
        UUID(scene_id)
    except ValueError:
        raise ValidationError("Invalid scene_id format")

    with get_db() as db:
        # Verify scene exists and user has access
        scene = db.query(Scene).filter_by(id=scene_id).first()
        if not scene:
            raise NotFoundError("Scene not found")

        # Get all physics objects for the scene
        physics_objects = db.query(PhysicsObject).filter_by(scene_id=scene_id).all()
        return jsonify([obj.to_dict() for obj in physics_objects])


@physics_objects_bp.route('/<physics_object_id>', methods=['GET'])
@jwt_required()
def get_physics_object(physics_object_id):
    """Get a specific physics object."""
    current_user_id = get_jwt_identity()

    try:
        UUID(physics_object_id)
    except ValueError:
        raise ValidationError("Invalid physics_object_id format")

    with get_db() as db:
        physics_object = db.query(PhysicsObject).filter_by(id=physics_object_id).first()

        if not physics_object:
            raise NotFoundError("Physics object not found")

        # Verify user has access to the related scene
        scene = db.query(Scene).filter_by(id=physics_object.scene_id).first()
        if scene.creator_id != current_user_id:
            # Check if user is also the universe owner
            if scene.universe.user_id != current_user_id:
                raise AuthorizationError("You don't have permission to access this physics object")

        return jsonify(physics_object.to_dict())


@physics_objects_bp.route('/', methods=['POST'])
@jwt_required()
def create_physics_object():
    """Create a new physics object."""
    current_user_id = get_jwt_identity()
    data = request.json

    if not data:
        raise ValidationError("No data provided")

    required_fields = ['name', 'scene_id']
    for field in required_fields:
        if field not in data:
            raise ValidationError(f"Missing required field: {field}")

    scene_id = data['scene_id']

    with get_db() as db:
        # Verify scene exists and user has access
        scene = db.query(Scene).filter_by(id=scene_id).first()
        if not scene:
            raise NotFoundError("Scene not found")

        if scene.creator_id != current_user_id:
            # Check if user is also the universe owner
            if scene.universe.user_id != current_user_id:
                raise AuthorizationError("You don't have permission to add physics objects to this scene")

        # Create new physics object with user_id
        physics_object = PhysicsObject(
            name=data['name'],
            scene_id=scene_id,
            user_id=current_user_id,
            mass=data.get('mass', 1.0),
            position=data.get('position', {"x": 0.0, "y": 0.0, "z": 0.0}),
            velocity=data.get('velocity', {"x": 0.0, "y": 0.0, "z": 0.0}),
            acceleration=data.get('acceleration', {"x": 0.0, "y": 0.0, "z": 0.0}),
            rotation=data.get('rotation', {"x": 0.0, "y": 0.0, "z": 0.0}),
            angular_velocity=data.get('angular_velocity', {"x": 0.0, "y": 0.0, "z": 0.0}),
            scale=data.get('scale', {"x": 1.0, "y": 1.0, "z": 1.0}),
            is_static=data.get('is_static', False),
            is_trigger=data.get('is_trigger', False),
            collision_shape=data.get('collision_shape', "box"),
            collision_params=data.get('collision_params', {}),
            material_properties=data.get('material_properties', {
                "restitution": 0.7,
                "friction": 0.3,
                "density": 1.0
            })
        )

        db.add(physics_object)
        db.commit()
        db.refresh(physics_object)

        return jsonify(physics_object.to_dict()), 201


@physics_objects_bp.route('/<physics_object_id>', methods=['PUT'])
@jwt_required()
def update_physics_object(physics_object_id):
    """Update a physics object."""
    current_user_id = get_jwt_identity()
    data = request.json

    if not data:
        raise ValidationError("No data provided")

    try:
        UUID(physics_object_id)
    except ValueError:
        raise ValidationError("Invalid physics_object_id format")

    with get_db() as db:
        physics_object = db.query(PhysicsObject).filter_by(id=physics_object_id).first()

        if not physics_object:
            raise NotFoundError("Physics object not found")

        # Verify user has permission
        if physics_object.user_id != current_user_id:
            raise AuthorizationError("You don't have permission to update this physics object")

        # Update fields
        for key, value in data.items():
            if hasattr(physics_object, key):
                setattr(physics_object, key, value)

        db.commit()
        db.refresh(physics_object)

        return jsonify(physics_object.to_dict())


@physics_objects_bp.route('/<physics_object_id>', methods=['DELETE'])
@jwt_required()
def delete_physics_object(physics_object_id):
    """Delete a physics object."""
    current_user_id = get_jwt_identity()

    try:
        UUID(physics_object_id)
    except ValueError:
        raise ValidationError("Invalid physics_object_id format")

    with get_db() as db:
        physics_object = db.query(PhysicsObject).filter_by(id=physics_object_id).first()

        if not physics_object:
            raise NotFoundError("Physics object not found")

        # Verify user has permission
        if physics_object.user_id != current_user_id:
            raise AuthorizationError("You don't have permission to delete this physics object")

        db.delete(physics_object)
        db.commit()

        return jsonify({"message": "Physics object deleted successfully"}), 200
