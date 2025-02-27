"""Scene management routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.universe.scene import Scene
from app.models.universe.universe import Universe
from app.db.session import get_db
from app.core.errors import ValidationError, NotFoundError, AuthorizationError
from uuid import UUID

scenes_bp = Blueprint('scenes', __name__)

@scenes_bp.route('/', methods=['POST'])
@jwt_required()
def create_scene():
    """Create a new scene."""
    current_user_id = get_jwt_identity()
    data = request.json

    if not data:
        raise ValidationError("No data provided")

    required_fields = ['name', 'universe_id']
    for field in required_fields:
        if field not in data:
            raise ValidationError(f"Missing required field: {field}")

    try:
        universe_id = UUID(data['universe_id'])
    except ValueError:
        raise ValidationError("Invalid universe_id format")

    with get_db() as db:
        # Verify universe exists
        universe = db.query(Universe).filter_by(id=universe_id).first()
        if not universe:
            raise NotFoundError("Universe not found")

        # Create scene
        scene = Scene(
            name=data['name'],
            description=data.get('description'),
            universe_id=universe_id,
            creator_id=current_user_id
        )

        db.add(scene)
        db.commit()
        db.refresh(scene)

        return jsonify(scene.to_dict()), 201

@scenes_bp.route('/<scene_id>', methods=['GET'])
@jwt_required()
def get_scene(scene_id):
    """Get scene details."""
    current_user_id = get_jwt_identity()

    try:
        UUID(scene_id)
    except ValueError:
        raise ValidationError("Invalid scene_id format")

    with get_db() as db:
        scene = db.query(Scene).filter_by(id=scene_id).first()
        if not scene:
            raise NotFoundError("Scene not found")

        # Check permissions
        if str(scene.creator_id) != current_user_id and str(scene.universe.user_id) != current_user_id:
            raise AuthorizationError("You don't have permission to view this scene")

        return jsonify(scene.to_dict())

@scenes_bp.route('/<scene_id>', methods=['PUT'])
@jwt_required()
def update_scene(scene_id):
    """Update scene details."""
    current_user_id = get_jwt_identity()
    data = request.json

    if not data:
        raise ValidationError("No data provided")

    try:
        UUID(scene_id)
    except ValueError:
        raise ValidationError("Invalid scene_id format")

    with get_db() as db:
        scene = db.query(Scene).filter_by(id=scene_id).first()
        if not scene:
            raise NotFoundError("Scene not found")

        # Check permissions
        if str(scene.creator_id) != current_user_id and str(scene.universe.user_id) != current_user_id:
            raise AuthorizationError("You don't have permission to update this scene")

        # Update fields
        allowed_fields = {'name', 'description'}
        for field in allowed_fields:
            if field in data:
                setattr(scene, field, data[field])

        db.commit()
        db.refresh(scene)

        return jsonify(scene.to_dict())

@scenes_bp.route('/<scene_id>', methods=['DELETE'])
@jwt_required()
def delete_scene(scene_id):
    """Delete a scene."""
    current_user_id = get_jwt_identity()

    try:
        UUID(scene_id)
    except ValueError:
        raise ValidationError("Invalid scene_id format")

    with get_db() as db:
        scene = db.query(Scene).filter_by(id=scene_id).first()
        if not scene:
            raise NotFoundError("Scene not found")

        # Check permissions
        if str(scene.creator_id) != current_user_id and str(scene.universe.user_id) != current_user_id:
            raise AuthorizationError("You don't have permission to delete this scene")

        db.delete(scene)
        db.commit()

        return jsonify({"message": "Scene deleted successfully"})
