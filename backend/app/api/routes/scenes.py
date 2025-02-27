from typing import List, Optional
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api import deps
from app.crud import crud_scene
from app.models.universe.scene import Scene
from app.core.errors import ValidationError, NotFoundError
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.physics import physics_parameter
from app.models.physics.physics_parameter import PhysicsParameterCreate, PhysicsParameterUpdate

scenes_bp = Blueprint('scenes', __name__)

class ReorderRequest(BaseModel):
    universe_id: str
    scene_ids: List[str]

@scenes_bp.route("/", methods=['GET'])
def get_scenes():
    """
    Retrieve scenes with optional filtering.
    """
    db = deps.get_db()
    universe_id = request.args.get('universe_id')
    creator_id = request.args.get('creator_id')
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 100, type=int)

    if universe_id:
        scenes = crud_scene.get_by_universe(db, universe_id=universe_id)
    elif creator_id:
        scenes = crud_scene.get_by_creator(db, creator_id=creator_id)
    else:
        scenes = crud_scene.get_multi(db, skip=skip, limit=limit)

    return jsonify([scene.to_dict() for scene in scenes])

@scenes_bp.route("/", methods=['POST'])
@jwt_required()
def create_scene():
    """
    Create new scene.
    """
    db = deps.get_db()
    data = request.get_json()
    current_user = deps.get_current_user()

    scene_in = SceneCreate(**data)
    scene = crud_scene.create(db, obj_in=scene_in, creator_id=current_user.id)

    return jsonify(scene.to_dict())

@scenes_bp.route("/<scene_id>", methods=['GET'])
def get_scene(scene_id: str):
    """
    Get scene by ID.
    """
    db = deps.get_db()
    scene = crud_scene.get(db, id=scene_id)
    if not scene:
        raise NotFoundError(f"Scene {scene_id} not found")

    return jsonify(scene.to_dict())

@scenes_bp.route("/<scene_id>", methods=['PUT'])
@jwt_required()
def update_scene(scene_id: str):
    """
    Update scene.
    """
    db = deps.get_db()
    current_user = deps.get_current_user()
    data = request.get_json()

    scene = crud_scene.get(db, id=scene_id)
    if not scene:
        raise NotFoundError(f"Scene {scene_id} not found")

    if scene.creator_id != current_user.id:
        raise ValidationError("Not enough permissions")

    scene_in = SceneUpdate(**data)
    scene = crud_scene.update(db, db_obj=scene, obj_in=scene_in)

    return jsonify(scene.to_dict())

@scenes_bp.route("/<scene_id>", methods=['DELETE'])
@jwt_required()
def delete_scene(scene_id: str):
    """
    Delete scene.
    """
    db = deps.get_db()
    current_user = deps.get_current_user()

    scene = crud_scene.get(db, id=scene_id)
    if not scene:
        raise NotFoundError(f"Scene {scene_id} not found")

    if scene.creator_id != current_user.id:
        raise ValidationError("Not enough permissions")

    crud_scene.remove(db, id=scene_id)
    return jsonify({"status": "success"})

@scenes_bp.route("/reorder", methods=['POST'])
@jwt_required()
def reorder_scenes():
    """
    Reorder scenes in a universe.
    """
    db = deps.get_db()
    current_user = deps.get_current_user()
    data = request.get_json()

    if not all(k in data for k in ('universe_id', 'scene_ids')):
        raise ValidationError("Missing required fields")

    scenes = crud_scene.reorder(
        db,
        universe_id=data['universe_id'],
        scene_ids=data['scene_ids'],
        current_user_id=current_user.id
    )

    return jsonify([scene.to_dict() for scene in scenes])

# Physics Parameters routes
@scenes_bp.route("/<scene_id>/physics_parameters", methods=['GET'])
def get_physics_parameters(scene_id):
    """
    Get physics parameters for a scene.
    """
    db = deps.get_db()
    scene = crud_scene.get(db, id=scene_id)
    if not scene:
        raise NotFoundError(f"Scene {scene_id} not found")

    params = physics_parameter.get_by_scene(db, scene_id=scene_id)
    if not params:
        return jsonify([])

    return jsonify([param.to_dict() for param in params])

@scenes_bp.route("/<scene_id>/physics_parameters/<params_id>", methods=['GET'])
def get_physics_parameter(scene_id, params_id):
    """
    Get a specific physics parameter by ID.
    """
    db = deps.get_db()
    scene = crud_scene.get(db, id=scene_id)
    if not scene:
        raise NotFoundError(f"Scene {scene_id} not found")

    param = physics_parameter.get(db, id=params_id)
    if not param or param.scene_id != scene_id:
        raise NotFoundError(f"Physics parameter {params_id} not found for scene {scene_id}")

    return jsonify(param.to_dict())

@scenes_bp.route("/<scene_id>/physics_parameters", methods=['POST'])
@jwt_required()
def create_physics_parameter(scene_id):
    """
    Create a new physics parameter for a scene.
    """
    db = deps.get_db()
    current_user = deps.get_current_user()
    data = request.get_json()

    scene = crud_scene.get(db, id=scene_id)
    if not scene:
        raise NotFoundError(f"Scene {scene_id} not found")

    if scene.creator_id != current_user.id:
        raise ValidationError("Not enough permissions")

    data["scene_id"] = scene_id
    param_in = PhysicsParameterCreate(**data)
    param = physics_parameter.create_with_scene(db, obj_in=param_in)

    return jsonify(param.to_dict())

@scenes_bp.route("/<scene_id>/physics_parameters/<params_id>", methods=['PUT'])
@jwt_required()
def update_physics_parameter(scene_id, params_id):
    """
    Update a physics parameter.
    """
    db = deps.get_db()
    current_user = deps.get_current_user()
    data = request.get_json()

    scene = crud_scene.get(db, id=scene_id)
    if not scene:
        raise NotFoundError(f"Scene {scene_id} not found")

    if scene.creator_id != current_user.id:
        raise ValidationError("Not enough permissions")

    param = physics_parameter.get(db, id=params_id)
    if not param or param.scene_id != scene_id:
        raise NotFoundError(f"Physics parameter {params_id} not found for scene {scene_id}")

    param_in = PhysicsParameterUpdate(**data)
    param = physics_parameter.update(db, db_obj=param, obj_in=param_in)

    return jsonify(param.to_dict())

@scenes_bp.route("/<scene_id>/physics_parameters/<params_id>", methods=['DELETE'])
@jwt_required()
def delete_physics_parameter(scene_id, params_id):
    """
    Delete a physics parameter.
    """
    db = deps.get_db()
    current_user = deps.get_current_user()

    scene = crud_scene.get(db, id=scene_id)
    if not scene:
        raise NotFoundError(f"Scene {scene_id} not found")

    if scene.creator_id != current_user.id:
        raise ValidationError("Not enough permissions")

    param = physics_parameter.get(db, id=params_id)
    if not param or param.scene_id != scene_id:
        raise NotFoundError(f"Physics parameter {params_id} not found for scene {scene_id}")

    physics_parameter.remove(db, id=params_id)

    return jsonify({"status": "success"})
