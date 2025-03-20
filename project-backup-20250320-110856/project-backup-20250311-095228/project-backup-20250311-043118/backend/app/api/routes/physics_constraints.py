"""Physics constraints API routes."""
import json
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from backend.app.models.physics.physics_constraint import PhysicsConstraint
from backend.app.models.physics.physics_object import PhysicsObject
from backend.app.models.universe.scene import Scene
from backend.app.db.session import db_session
from uuid import UUID
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

physics_constraints_bp = Blueprint("physics_constraints", __name__)


@physics_constraints_bp.route("/", methods=["POST"])
@jwt_required()
def create_physics_constraint():
    """Create a new physics constraint."""
    user_id = get_jwt_identity()
    data = request.json

    # Validate required fields
    required_fields = ["scene_id", "type", "object1_id", "object2_id"]
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        return (
            jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}),
            400,
        )

    # Validate that the scene exists and user has access
    try:
        scene = db_session.query(Scene).filter(Scene.id == data["scene_id"]).first()
        if not scene:
            return jsonify({"error": "Scene not found"}), 404

        # Check if user has access to the scene's universe
        if scene.universe.user_id != UUID(user_id):
            return jsonify({"error": "Unauthorized access to scene"}), 403

        # Validate that both objects exist and belong to this scene
        object1 = (
            db_session.query(PhysicsObject)
            .filter(
                PhysicsObject.id == data["object1_id"],
                PhysicsObject.scene_id == data["scene_id"],
            )
            .first()
        )

        object2 = (
            db_session.query(PhysicsObject)
            .filter(
                PhysicsObject.id == data["object2_id"],
                PhysicsObject.scene_id == data["scene_id"],
            )
            .first()
        )

        if not object1 or not object2:
            return (
                jsonify(
                    {"error": "One or both physics objects not found in this scene"}
                ),
                404,
            )

        # Create new constraint
        new_constraint = PhysicsConstraint(
            name=data.get("name", f"Constraint_{data['type']}"),
            type=data["type"],
            scene_id=data["scene_id"],
            object1_id=data["object1_id"],
            object2_id=data["object2_id"],
            parameters=data.get("parameters", {}),
        )

        db_session.add(new_constraint)
        db_session.commit()

        return jsonify(new_constraint.to_dict()), 201

    except SQLAlchemyError as e:
        db_session.rollback()
        logger.error(f"Database error creating physics constraint: {str(e)}")
        return jsonify({"error": "Database error creating physics constraint"}), 500
    except Exception as e:
        logger.error(f"Error creating physics constraint: {str(e)}")
        return jsonify({"error": "Error creating physics constraint"}), 500


@physics_constraints_bp.route("/", methods=["GET"])
@jwt_required()
def get_physics_constraints():
    """Get physics constraints for a scene."""
    user_id = get_jwt_identity()
    scene_id = request.args.get("scene_id")

    if not scene_id:
        return jsonify({"error": "scene_id parameter is required"}), 400

    try:
        # Validate that the scene exists and user has access
        scene = db_session.query(Scene).filter(Scene.id == scene_id).first()
        if not scene:
            return jsonify({"error": "Scene not found"}), 404

        # Check if user has access to the scene's universe
        if scene.universe.user_id != UUID(user_id):
            return jsonify({"error": "Unauthorized access to scene"}), 403

        # Query constraints for this scene
        constraints = (
            db_session.query(PhysicsConstraint)
            .filter(PhysicsConstraint.scene_id == scene_id)
            .all()
        )

        return jsonify([constraint.to_dict() for constraint in constraints]), 200

    except SQLAlchemyError as e:
        logger.error(f"Database error fetching physics constraints: {str(e)}")
        return jsonify({"error": "Database error fetching physics constraints"}), 500
    except Exception as e:
        logger.error(f"Error fetching physics constraints: {str(e)}")
        return jsonify({"error": "Error fetching physics constraints"}), 500


@physics_constraints_bp.route("/<string:constraint_id>", methods=["GET"])
@jwt_required()
def get_single_physics_constraint(constraint_id):
    """Get a single physics constraint by ID."""
    user_id = get_jwt_identity()

    try:
        # Get the constraint
        constraint = (
            db_session.query(PhysicsConstraint)
            .filter(PhysicsConstraint.id == constraint_id)
            .first()
        )

        if not constraint:
            return jsonify({"error": "Physics constraint not found"}), 404

        # Validate that the user has access to the scene's universe
        scene = db_session.query(Scene).filter(Scene.id == constraint.scene_id).first()
        if scene.universe.user_id != UUID(user_id):
            return jsonify({"error": "Unauthorized access to physics constraint"}), 403

        return jsonify(constraint.to_dict()), 200

    except SQLAlchemyError as e:
        logger.error(f"Database error fetching physics constraint: {str(e)}")
        return jsonify({"error": "Database error fetching physics constraint"}), 500
    except Exception as e:
        logger.error(f"Error fetching physics constraint: {str(e)}")
        return jsonify({"error": "Error fetching physics constraint"}), 500


@physics_constraints_bp.route("/<string:constraint_id>", methods=["PUT"])
@jwt_required()
def update_physics_constraint(constraint_id):
    """Update a physics constraint."""
    user_id = get_jwt_identity()
    data = request.json

    try:
        # Get the constraint
        constraint = (
            db_session.query(PhysicsConstraint)
            .filter(PhysicsConstraint.id == constraint_id)
            .first()
        )

        if not constraint:
            return jsonify({"error": "Physics constraint not found"}), 404

        # Validate that the user has access to the scene's universe
        scene = db_session.query(Scene).filter(Scene.id == constraint.scene_id).first()
        if scene.universe.user_id != UUID(user_id):
            return jsonify({"error": "Unauthorized access to physics constraint"}), 403

        # Update the constraint
        if "name" in data:
            constraint.name = data["name"]
        if "type" in data:
            constraint.type = data["type"]
        if "parameters" in data:
            constraint.parameters = data["parameters"]

        db_session.commit()

        return jsonify(constraint.to_dict()), 200

    except SQLAlchemyError as e:
        db_session.rollback()
        logger.error(f"Database error updating physics constraint: {str(e)}")
        return jsonify({"error": "Database error updating physics constraint"}), 500
    except Exception as e:
        logger.error(f"Error updating physics constraint: {str(e)}")
        return jsonify({"error": "Error updating physics constraint"}), 500


@physics_constraints_bp.route("/<string:constraint_id>", methods=["DELETE"])
@jwt_required()
def delete_physics_constraint(constraint_id):
    """Delete a physics constraint."""
    user_id = get_jwt_identity()

    try:
        # Get the constraint
        constraint = (
            db_session.query(PhysicsConstraint)
            .filter(PhysicsConstraint.id == constraint_id)
            .first()
        )

        if not constraint:
            return jsonify({"error": "Physics constraint not found"}), 404

        # Validate that the user has access to the scene's universe
        scene = db_session.query(Scene).filter(Scene.id == constraint.scene_id).first()
        if scene.universe.user_id != UUID(user_id):
            return jsonify({"error": "Unauthorized access to physics constraint"}), 403

        # Delete the constraint
        db_session.delete(constraint)
        db_session.commit()

        return jsonify({"message": "Physics constraint deleted successfully"}), 200

    except SQLAlchemyError as e:
        db_session.rollback()
        logger.error(f"Database error deleting physics constraint: {str(e)}")
        return jsonify({"error": "Database error deleting physics constraint"}), 500
    except Exception as e:
        logger.error(f"Error deleting physics constraint: {str(e)}")
        return jsonify({"error": "Error deleting physics constraint"}), 500
