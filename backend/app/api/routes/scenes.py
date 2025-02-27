from typing import List, Optional
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.repositories.scene import SceneRepository
from app.db.repositories.physics_parameter import PhysicsParameterRepository
from app.models.universe.scene import Scene
from app.core.errors import ValidationError, NotFoundError
from app.core.auth import get_current_user
from flask_jwt_extended import jwt_required, get_jwt_identity

scenes_bp = Blueprint('scenes', __name__)

class ReorderRequest(BaseModel):
    universe_id: str
    scene_ids: List[str]

@scenes_bp.route("/", methods=['GET'], strict_slashes=False)
def get_scenes():
    """
    Retrieve scenes with optional filtering.
    """
    universe_id = request.args.get('universe_id')
    creator_id = request.args.get('creator_id')
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 100, type=int)

    with get_db() as db:
        scene_repo = SceneRepository(db)

        if universe_id:
            scenes = scene_repo.get_scenes_by_universe(universe_id)
        elif creator_id:
            scenes = scene_repo.get_scenes_by_creator(creator_id)
        else:
            scenes = scene_repo.get_scenes(skip=skip, limit=limit)

        return jsonify([scene.to_dict() for scene in scenes])

@scenes_bp.route("/", methods=['POST'], strict_slashes=False)
@jwt_required()
def create_scene():
    """
    Create new scene.
    """
    data = request.get_json()
    current_user = get_current_user()

    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.create_scene(data, creator_id=current_user.id)
        return jsonify(scene.to_dict())

@scenes_bp.route("/<scene_id>", methods=['GET'])
def get_scene(scene_id: str):
    """
    Get scene by ID.
    """
    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.get_scene_by_id(scene_id)

        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        return jsonify(scene.to_dict())

@scenes_bp.route("/<scene_id>", methods=['PUT'])
@jwt_required()
def update_scene(scene_id: str):
    """
    Update scene.
    """
    current_user = get_current_user()
    data = request.get_json()

    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.get_scene_by_id(scene_id)

        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        if scene.creator_id != current_user.id:
            raise ValidationError("Not enough permissions")

        scene = scene_repo.update_scene(scene_id, data)
        return jsonify(scene.to_dict())

@scenes_bp.route("/<scene_id>", methods=['DELETE'])
@jwt_required()
def delete_scene(scene_id: str):
    """
    Delete scene.
    """
    current_user = get_current_user()

    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.get_scene_by_id(scene_id)

        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        if scene.creator_id != current_user.id:
            raise ValidationError("Not enough permissions")

        scene_repo.delete_scene(scene_id)
        return jsonify({"status": "success"})

@scenes_bp.route("/reorder", methods=['POST'], strict_slashes=False)
@jwt_required()
def reorder_scenes():
    """
    Reorder scenes in a universe.
    """
    current_user = get_current_user()
    data = request.get_json()

    if not all(k in data for k in ('universe_id', 'scene_ids')):
        raise ValidationError("Missing required fields")

    with get_db() as db:
        scene_repo = SceneRepository(db)
        scenes = scene_repo.reorder_scenes(
            universe_id=data['universe_id'],
            scene_ids=data['scene_ids'],
            current_user_id=current_user.id
        )
        return jsonify([scene.to_dict() for scene in scenes])

# Physics Parameters routes
@scenes_bp.route("/<scene_id>/physics_parameters", methods=['GET'], strict_slashes=False)
@scenes_bp.route("/<scene_id>/physics_parameters/", methods=['GET'], strict_slashes=False)
def get_physics_parameters(scene_id):
    """
    Get physics parameters for a scene.
    """
    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.get_scene_by_id(scene_id)

        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        physics_param_repo = PhysicsParameterRepository(db)
        params = physics_param_repo.get_by_scene(scene_id)
        if not params:
            return jsonify([])

        return jsonify([param.to_dict() for param in params])

@scenes_bp.route("/<scene_id>/physics_parameters/<params_id>", methods=['GET'], strict_slashes=False)
@scenes_bp.route("/<scene_id>/physics_parameters/<params_id>/", methods=['GET'], strict_slashes=False)
def get_physics_parameter(scene_id, params_id):
    """
    Get a specific physics parameter by ID.
    """
    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.get_scene_by_id(scene_id)

        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        physics_param_repo = PhysicsParameterRepository(db)
        param = physics_param_repo.get(params_id)
        if not param or str(param.scene_id) != scene_id:
            raise NotFoundError(f"Physics parameter {params_id} not found for scene {scene_id}")

        return jsonify(param.to_dict())

@scenes_bp.route("/<scene_id>/physics_parameters", methods=['POST'], strict_slashes=False)
@scenes_bp.route("/<scene_id>/physics_parameters/", methods=['POST'], strict_slashes=False)
@jwt_required()
def create_physics_parameter(scene_id):
    """
    Create a new physics parameter for a scene.
    """
    current_user = get_current_user()
    data = request.get_json()

    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.get_scene_by_id(scene_id)

        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        if scene.creator_id != current_user.id:
            raise ValidationError("Not enough permissions")

        data["scene_id"] = scene_id

        physics_param_repo = PhysicsParameterRepository(db)
        param = physics_param_repo.create_with_scene(data)
        return jsonify(param.to_dict())

@scenes_bp.route("/<scene_id>/physics_parameters/<params_id>", methods=['PUT'], strict_slashes=False)
@scenes_bp.route("/<scene_id>/physics_parameters/<params_id>/", methods=['PUT'], strict_slashes=False)
@jwt_required()
def update_physics_parameter(scene_id, params_id):
    """
    Update a physics parameter.
    """
    current_user = get_current_user()
    data = request.get_json()

    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.get_scene_by_id(scene_id)

        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        if scene.creator_id != current_user.id:
            raise ValidationError("Not enough permissions")

        physics_param_repo = PhysicsParameterRepository(db)
        param = physics_param_repo.get(params_id)
        if not param or str(param.scene_id) != scene_id:
            raise NotFoundError(f"Physics parameter {params_id} not found for scene {scene_id}")

        param = physics_param_repo.update(param, data)
        return jsonify(param.to_dict())

@scenes_bp.route("/<scene_id>/physics_parameters/<params_id>", methods=['DELETE'], strict_slashes=False)
@scenes_bp.route("/<scene_id>/physics_parameters/<params_id>/", methods=['DELETE'], strict_slashes=False)
@jwt_required()
def delete_physics_parameter(scene_id, params_id):
    """
    Delete a physics parameter.
    """
    current_user = get_current_user()

    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.get_scene_by_id(scene_id)

        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        if scene.creator_id != current_user.id:
            raise ValidationError("Not enough permissions")

        physics_param_repo = PhysicsParameterRepository(db)
        param = physics_param_repo.get(params_id)
        if not param or str(param.scene_id) != scene_id:
            raise NotFoundError(f"Physics parameter {params_id} not found for scene {scene_id}")

        physics_param_repo.remove(params_id)
        return jsonify({"status": "success"})
