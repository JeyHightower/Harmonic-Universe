from typing import List, Optional
from flask import Blueprint, request, jsonify, g
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel
import time

from backend.app.db.session import get_db
from backend.app.db.repositories.scene import SceneRepository
from backend.app.db.repositories.physics_parameter import PhysicsParameterRepository
from backend.app.db.repositories.harmony_parameter import HarmonyParameterRepository
from backend.app.db.repositories.universe import UniverseRepository
from backend.app.models.universe.scene import Scene
from backend.app.models.universe.universe import Universe
from backend.app.core.errors import ValidationError, NotFoundError
from backend.app.core.auth import get_current_user
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.middlewares.auth import auth_required

scenes_bp = Blueprint("scenes", __name__, url_prefix="/api/scenes")

# Mock database for testing
scenes_db = [
    {
        "id": 1,
        "title": "Sample Scene",
        "description": "A sample scene for testing",
        "universe_id": 1,
        "order": 1,
        "created_at": int(time.time())
    }
]

class ReorderRequest(BaseModel):
    universe_id: str
    scene_ids: List[str]


@scenes_bp.route("/", methods=["GET"])
@auth_required
def get_all_scenes():
    """
    Get all scenes that belong to universes owned by the current user.
    Can filter by universe_id query parameter.
    """
    try:
        user_id = g.user.id
        universe_id = request.args.get("universe_id")

        # Base query
        query = Scene.query.join(Universe).filter(Universe.user_id == user_id)

        # Filter by universe_id if provided
        if universe_id:
            query = query.filter(Scene.universe_id == universe_id)

        # Order by universe_id and scene order
        scenes = query.order_by(Scene.universe_id, Scene.order).all()

        return (
            jsonify(
                {
                    "status": "success",
                    "data": {"scenes": [scene.to_dict() for scene in scenes]},
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@scenes_bp.route("/<int:scene_id>", methods=["GET"])
@auth_required
def get_scene(scene_id):
    """Get a specific scene by ID if it belongs to a universe owned by the user or is public"""
    try:
        user_id = g.user.id
        scene = Scene.query.get(scene_id)

        if not scene:
            return jsonify({"status": "error", "message": "Scene not found"}), 404

        # Get the parent universe to check access
        universe = Universe.query.get(scene.universe_id)

        # Check if the user has access (owner or public universe)
        if universe.user_id != user_id and not universe.is_public:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "You do not have permission to access this scene",
                    }
                ),
                403,
            )

        return (
            jsonify(
                {
                    "status": "success",
                    "data": {"scene": scene.to_dict_with_relationships()},
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@scenes_bp.route("/", methods=["POST"])
@auth_required
def create_scene():
    """Create a new scene in a universe owned by the user"""
    try:
        user_id = g.user.id
        data = request.get_json()

        # Validate required fields
        if not data.get("title"):
            return jsonify({"status": "error", "message": "Title is required"}), 400

        if not data.get("universe_id"):
            return (
                jsonify({"status": "error", "message": "Universe ID is required"}),
                400,
            )

        # Verify the universe exists and belongs to the user
        universe = Universe.query.get(data["universe_id"])

        if not universe:
            return jsonify({"status": "error", "message": "Universe not found"}), 404

        if universe.user_id != user_id:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "You do not have permission to add scenes to this universe",
                    }
                ),
                403,
            )

        # Get the highest existing order value for scenes in this universe
        highest_order = (
            db_session.query(db_session.func.max(Scene.order))
            .filter_by(universe_id=data["universe_id"])
            .scalar()
            or 0
        )

        # Create new scene
        new_scene = Scene(
            title=data.get("title"),
            description=data.get("description"),
            image_url=data.get("image_url"),
            universe_id=data["universe_id"],
            order=highest_order + 1,  # Set order to next value
            scene_type=data.get("scene_type", "standard"),
            is_active=data.get("is_active", True),
            duration=data.get("duration", 60.0),
            tempo=data.get("tempo", 120.0),
        )

        # Add JSON parameters if provided
        if data.get("physics_parameters"):
            new_scene.physics_parameters = data["physics_parameters"]

        if data.get("harmony_parameters"):
            new_scene.harmony_parameters = data["harmony_parameters"]

        if data.get("visualization_settings"):
            new_scene.visualization_settings = data["visualization_settings"]

        db_session.add(new_scene)
        db_session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Scene created successfully",
                    "data": {"scene": new_scene.to_dict()},
                }
            ),
            201,
        )
    except SQLAlchemyError as e:
        db_session.rollback()
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@scenes_bp.route("/<int:scene_id>", methods=["PUT"])
@auth_required
def update_scene(scene_id):
    """Update an existing scene if it belongs to a universe owned by the user"""
    try:
        user_id = g.user.id
        scene = Scene.query.get(scene_id)

        if not scene:
            return jsonify({"status": "error", "message": "Scene not found"}), 404

        # Get the parent universe to check access
        universe = Universe.query.get(scene.universe_id)

        # Check if the user has permission to update
        if universe.user_id != user_id:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "You do not have permission to update this scene",
                    }
                ),
                403,
            )

        # Update fields
        data = request.get_json()

        if "title" in data:
            scene.title = data["title"]
        if "description" in data:
            scene.description = data["description"]
        if "image_url" in data:
            scene.image_url = data["image_url"]
        if "scene_type" in data:
            scene.scene_type = data["scene_type"]
        if "is_active" in data:
            scene.is_active = data["is_active"]
        if "is_complete" in data:
            scene.is_complete = data["is_complete"]
        if "duration" in data:
            scene.duration = data["duration"]
        if "tempo" in data:
            scene.tempo = data["tempo"]

        # Update JSON parameters if provided
        if "physics_parameters" in data:
            scene.physics_parameters = data["physics_parameters"]
        if "harmony_parameters" in data:
            scene.harmony_parameters = data["harmony_parameters"]
        if "visualization_settings" in data:
            scene.visualization_settings = data["visualization_settings"]

        db_session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Scene updated successfully",
                    "data": {"scene": scene.to_dict()},
                }
            ),
            200,
        )
    except SQLAlchemyError as e:
        db_session.rollback()
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@scenes_bp.route("/<int:scene_id>", methods=["DELETE"])
@auth_required
def delete_scene(scene_id):
    """Delete a scene if it belongs to a universe owned by the user"""
    try:
        user_id = g.user.id
        scene = Scene.query.get(scene_id)

        if not scene:
            return jsonify({"status": "error", "message": "Scene not found"}), 404

        # Get the parent universe to check access
        universe = Universe.query.get(scene.universe_id)

        # Check if the user has permission to delete
        if universe.user_id != user_id:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "You do not have permission to delete this scene",
                    }
                ),
                403,
            )

        # Delete the scene
        db_session.delete(scene)
        db_session.commit()

        # Reorder remaining scenes
        remaining_scenes = (
            Scene.query.filter_by(universe_id=universe.id).order_by(Scene.order).all()
        )
        for index, remaining_scene in enumerate(remaining_scenes):
            remaining_scene.order = index + 1

        db_session.commit()

        return (
            jsonify({"status": "success", "message": "Scene deleted successfully"}),
            200,
        )
    except SQLAlchemyError as e:
        db_session.rollback()
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@scenes_bp.route("/reorder", methods=["POST"])
@auth_required
def reorder_scenes():
    """Reorder scenes within a universe"""
    try:
        user_id = g.user.id
        data = request.get_json()

        # Validate required fields
        if not data.get("universe_id"):
            return (
                jsonify({"status": "error", "message": "Universe ID is required"}),
                400,
            )

        if not data.get("scene_order") or not isinstance(data["scene_order"], list):
            return (
                jsonify(
                    {"status": "error", "message": "Scene order array is required"}
                ),
                400,
            )

        # Verify the universe exists and belongs to the user
        universe = Universe.query.get(data["universe_id"])

        if not universe:
            return jsonify({"status": "error", "message": "Universe not found"}), 404

        if universe.user_id != user_id:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "You do not have permission to reorder scenes in this universe",
                    }
                ),
                403,
            )

        # Update scene orders
        for index, scene_id in enumerate(data["scene_order"]):
            scene = Scene.query.get(scene_id)
            if scene and scene.universe_id == universe.id:
                scene.order = index + 1

        db_session.commit()

        # Return the updated scenes
        scenes = (
            Scene.query.filter_by(universe_id=universe.id).order_by(Scene.order).all()
        )

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Scenes reordered successfully",
                    "data": {"scenes": [scene.to_dict() for scene in scenes]},
                }
            ),
            200,
        )
    except SQLAlchemyError as e:
        db_session.rollback()
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# Physics Parameters routes
@scenes_bp.route("/<scene_id>/physics_parameters", methods=["GET"])
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


@scenes_bp.route("/<scene_id>/physics_parameters/<params_id>", methods=["GET"])
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
        if not param or str(param.scene_id) != str(scene_id):
            raise NotFoundError(
                f"Physics parameter {params_id} not found for scene {scene_id}"
            )

        return jsonify(param.to_dict())


@scenes_bp.route("/<scene_id>/physics_parameters", methods=["POST"])
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


@scenes_bp.route("/<scene_id>/physics_parameters/<params_id>", methods=["PUT"])
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

        if str(scene.creator_id) != str(current_user.id):
            raise ValidationError("Not enough permissions")

        physics_param_repo = PhysicsParameterRepository(db)
        param = physics_param_repo.get(params_id)
        if not param or str(param.scene_id) != str(scene_id):
            raise NotFoundError(
                f"Physics parameter {params_id} not found for scene {scene_id}"
            )

        try:
            param = physics_param_repo.update(param, data)
            return jsonify(param.to_dict())
        except Exception as e:
            raise ValidationError(f"Failed to update physics parameter: {str(e)}")


@scenes_bp.route("/<scene_id>/physics_parameters/<params_id>", methods=["DELETE"])
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

        if str(scene.creator_id) != str(current_user.id):
            raise ValidationError("Not enough permissions")

        physics_param_repo = PhysicsParameterRepository(db)
        param = physics_param_repo.get(params_id)
        if not param or str(param.scene_id) != str(scene_id):
            raise NotFoundError(
                f"Physics parameter {params_id} not found for scene {scene_id}"
            )

        try:
            physics_param_repo.remove(params_id)
            return jsonify({"status": "success"})
        except Exception as e:
            raise ValidationError(f"Failed to delete physics parameter: {str(e)}")


# Add harmony parameters routes after physics parameters routes
@scenes_bp.route("/<scene_id>/harmony_parameters", methods=["GET"])
def get_harmony_parameters(scene_id):
    """
    Get harmony parameters for a scene.
    """
    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.get_scene_by_id(scene_id)

        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        harmony_param_repo = HarmonyParameterRepository(db)
        params = harmony_param_repo.get_by_scene(scene_id)
        if not params:
            return jsonify([])

        return jsonify([param.to_dict() for param in params])


@scenes_bp.route("/<scene_id>/harmony_parameters/<params_id>", methods=["GET"])
def get_harmony_parameter(scene_id, params_id):
    """
    Get a specific harmony parameter by ID.
    """
    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.get_scene_by_id(scene_id)

        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        harmony_param_repo = HarmonyParameterRepository(db)
        param = harmony_param_repo.get(params_id)
        if not param or str(param.scene_id) != str(scene_id):
            raise NotFoundError(
                f"Harmony parameter {params_id} not found for scene {scene_id}"
            )

        return jsonify(param.to_dict())


@scenes_bp.route("/<scene_id>/harmony_parameters", methods=["POST"])
@jwt_required()
def create_harmony_parameter(scene_id):
    """
    Create a new harmony parameter for a scene.
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

        harmony_param_repo = HarmonyParameterRepository(db)
        param = harmony_param_repo.create_with_scene(data)
        return jsonify(param.to_dict())


@scenes_bp.route("/<scene_id>/harmony_parameters/<params_id>", methods=["PUT"])
@jwt_required()
def update_harmony_parameter(scene_id, params_id):
    """
    Update a harmony parameter.
    """
    current_user = get_current_user()
    data = request.get_json()

    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.get_scene_by_id(scene_id)

        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        if str(scene.creator_id) != str(current_user.id):
            raise ValidationError("Not enough permissions")

        harmony_param_repo = HarmonyParameterRepository(db)
        param = harmony_param_repo.get(params_id)
        if not param or str(param.scene_id) != str(scene_id):
            raise NotFoundError(
                f"Harmony parameter {params_id} not found for scene {scene_id}"
            )

        try:
            param = harmony_param_repo.update(param, data)
            return jsonify(param.to_dict())
        except Exception as e:
            raise ValidationError(f"Failed to update harmony parameter: {str(e)}")


@scenes_bp.route("/<scene_id>/harmony_parameters/<params_id>", methods=["DELETE"])
@jwt_required()
def delete_harmony_parameter(scene_id, params_id):
    """
    Delete a harmony parameter.
    """
    current_user = get_current_user()

    with get_db() as db:
        scene_repo = SceneRepository(db)
        scene = scene_repo.get_scene_by_id(scene_id)

        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        if str(scene.creator_id) != str(current_user.id):
            raise ValidationError("Not enough permissions")

        harmony_param_repo = HarmonyParameterRepository(db)
        param = harmony_param_repo.get(params_id)
        if not param or str(param.scene_id) != str(scene_id):
            raise NotFoundError(
                f"Harmony parameter {params_id} not found for scene {scene_id}"
            )

        try:
            harmony_param_repo.remove(params_id)
            return jsonify({"status": "success"})
        except Exception as e:
            raise ValidationError(f"Failed to delete harmony parameter: {str(e)}")
