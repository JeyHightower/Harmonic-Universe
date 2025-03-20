"""Universe routes."""
from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models.universe.universe import Universe
from backend.app.models.user import User
from backend.app.core.errors import (
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
)
from backend.app.db.session import get_db
from backend.app import socketio
from backend.app.core.auth import require_auth
from datetime import datetime
from uuid import UUID
from backend.app.db.repositories.universe import UniverseRepository
from sqlalchemy.exc import SQLAlchemyError
from ...db.database import db_session
from ...models.universe.scene import Scene
from ...middlewares.auth import auth_required
import logging

universe_bp = Blueprint("universe", __name__, url_prefix="/api/universes")
logger = logging.getLogger(__name__)


@universe_bp.route("/", methods=["GET"])
@auth_required
def get_all_universes():
    """
    Get all universes that belong to the current user.
    Can filter by is_public parameter to get public universes.
    """
    try:
        user_id = g.user.id
        show_public = request.args.get("public", "false").lower() == "true"

        # Base query for user's universes
        query = Universe.query.filter_by(user_id=user_id)

        # If showing public universes, include those as well
        if show_public:
            public_query = Universe.query.filter_by(is_public=True)
            query = query.union(public_query)

        universes = query.all()

        return (
            jsonify(
                {
                    "status": "success",
                    "data": {
                        "universes": [universe.to_dict() for universe in universes]
                    },
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@universe_bp.route("/<int:universe_id>", methods=["GET"])
@auth_required
def get_universe(universe_id):
    """Get a specific universe by ID if it belongs to the user or is public"""
    try:
        user_id = g.user.id
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({"status": "error", "message": "Universe not found"}), 404

        # Check if the user has access (owner or public universe)
        if universe.user_id != user_id and not universe.is_public:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "You do not have permission to access this universe",
                    }
                ),
                403,
            )

        # Determine if we should include scenes
        include_scenes = request.args.get("include_scenes", "false").lower() == "true"

        if include_scenes:
            return (
                jsonify(
                    {
                        "status": "success",
                        "data": {"universe": universe.to_dict_with_scenes()},
                    }
                ),
                200,
            )
        else:
            return (
                jsonify(
                    {"status": "success", "data": {"universe": universe.to_dict()}}
                ),
                200,
            )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@universe_bp.route("/", methods=["POST"])
@auth_required
def create_universe():
    """Create a new universe"""
    try:
        user_id = g.user.id
        data = request.get_json()

        # Validate required fields
        if not data.get("name"):
            return jsonify({"status": "error", "message": "Name is required"}), 400

        # Create new universe
        new_universe = Universe(
            name=data.get("name"),
            description=data.get("description"),
            image_url=data.get("image_url"),
            theme=data.get("theme"),
            genre=data.get("genre"),
            is_public=data.get("is_public", False),
            user_id=user_id,
        )

        db_session.add(new_universe)
        db_session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Universe created successfully",
                    "data": {"universe": new_universe.to_dict()},
                }
            ),
            201,
        )
    except SQLAlchemyError as e:
        db_session.rollback()
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@universe_bp.route("/<int:universe_id>", methods=["PUT"])
@auth_required
def update_universe(universe_id):
    """Update an existing universe if it belongs to the user"""
    try:
        user_id = g.user.id
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({"status": "error", "message": "Universe not found"}), 404

        # Check if the user has permission to update
        if universe.user_id != user_id:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "You do not have permission to update this universe",
                    }
                ),
                403,
            )

        # Update fields
        data = request.get_json()

        if "name" in data:
            universe.name = data["name"]
        if "description" in data:
            universe.description = data["description"]
        if "image_url" in data:
            universe.image_url = data["image_url"]
        if "theme" in data:
            universe.theme = data["theme"]
        if "genre" in data:
            universe.genre = data["genre"]
        if "is_public" in data:
            universe.is_public = data["is_public"]

        db_session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Universe updated successfully",
                    "data": {"universe": universe.to_dict()},
                }
            ),
            200,
        )
    except SQLAlchemyError as e:
        db_session.rollback()
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@universe_bp.route("/<int:universe_id>", methods=["DELETE"])
@auth_required
def delete_universe(universe_id):
    """Delete a universe if it belongs to the user"""
    try:
        user_id = g.user.id
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({"status": "error", "message": "Universe not found"}), 404

        # Check if the user has permission to delete
        if universe.user_id != user_id:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "You do not have permission to delete this universe",
                    }
                ),
                403,
            )

        # Delete the universe (cascades to scenes)
        db_session.delete(universe)
        db_session.commit()

        return (
            jsonify({"status": "success", "message": "Universe deleted successfully"}),
            200,
        )
    except SQLAlchemyError as e:
        db_session.rollback()
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# Get all scenes for a specific universe
@universe_bp.route("/<int:universe_id>/scenes", methods=["GET"])
@auth_required
def get_universe_scenes(universe_id):
    """Get all scenes for a specific universe if it belongs to the user or is public"""
    try:
        user_id = g.user.id
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({"status": "error", "message": "Universe not found"}), 404

        # Check if the user has access (owner or public universe)
        if universe.user_id != user_id and not universe.is_public:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "You do not have permission to access this universe",
                    }
                ),
                403,
            )

        # Get scenes ordered by the 'order' field
        scenes = (
            Scene.query.filter_by(universe_id=universe_id).order_by(Scene.order).all()
        )

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


@universe_bp.route("/<uuid:universe_id>/physics", methods=["PUT"])
@jwt_required()
def update_physics(universe_id):
    """Update universe physics parameters."""
    current_user_id = get_jwt_identity()

    with get_db() as db:
        try:
            # Get universe using get_by_id with row lock
            universe = (
                db.query(Universe)
                .filter(Universe.id == universe_id)
                .with_for_update()
                .first()
            )
            if not universe:
                raise ValidationError("Universe not found")

            # Use string comparison for UUIDs
            if str(universe.user_id) != str(current_user_id):
                raise AuthorizationError("Not authorized to update this universe")

            data = request.get_json()
            if not data:
                return (
                    jsonify(
                        {
                            "error_code": "ValidationError",
                            "message": "Invalid physics parameters",
                        }
                    ),
                    400,
                )

            physics_params = data.get("physics_params")
            if not physics_params:
                return (
                    jsonify(
                        {
                            "error_code": "ValidationError",
                            "message": "Invalid physics parameters",
                        }
                    ),
                    400,
                )

            try:
                # Update physics parameters
                universe.physics_params = physics_params

                # Add universe to session and commit
                db.add(universe)
                db.commit()

                # Return complete universe data with user role
                response_data = universe.to_dict()
                response_data["user_role"] = "owner"
                return jsonify(response_data)

            except ValueError as e:
                db.rollback()
                return (
                    jsonify({"error_code": "ValidationError", "message": str(e)}),
                    400,
                )

        except ValidationError as e:
            db.rollback()
            return jsonify({"error_code": "ValidationError", "message": str(e)}), 400
        except AuthorizationError as e:
            db.rollback()
            return jsonify({"error_code": "AuthorizationError", "message": str(e)}), 403
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating physics: {str(e)}", exc_info=True)
            return (
                jsonify(
                    {
                        "error_code": "InternalError",
                        "message": "An internal error occurred",
                    }
                ),
                500,
            )


@universe_bp.route("/<uuid:universe_id>/harmony/", methods=["PUT"])
@jwt_required()
def update_harmony(universe_id):
    """Update universe harmony parameters."""
    current_user_id = get_jwt_identity()

    with get_db() as db:
        try:
            universe_repo = UniverseRepository(db)
            universe = universe_repo.get_universe_by_id(str(universe_id))
            if not universe:
                raise ValidationError("Universe not found")

            # Use string comparison for UUIDs
            if str(universe.user_id) != str(current_user_id):
                raise AuthorizationError("Not authorized to update this universe")

            data = request.get_json()
            universe.update_harmony(data)
            db.add(universe)
            db.commit()

            # Notify connected clients about the harmony update
            socketio.emit(
                "harmony_changed",
                {
                    "universe_id": str(universe_id),
                    "parameters": universe.harmony_params,
                },
                room=f"universe_{universe_id}",
            )

            # Return complete universe data with user role
            response_data = universe.to_dict()
            response_data["user_role"] = "owner"
            return jsonify(response_data)
        except (ValidationError, AuthorizationError) as e:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise ValidationError(f"Error updating harmony: {str(e)}")


@universe_bp.route("/<uuid:universe_id>/story-points/", methods=["POST"])
@jwt_required()
def add_story_point(universe_id):
    """Add a story point to a universe."""
    current_user_id = get_jwt_identity()

    with get_db() as db:
        try:
            universe_repo = UniverseRepository(db)
            universe = universe_repo.get_universe_by_id(str(universe_id))
            if not universe:
                raise ValidationError("Universe not found")

            if universe.user_id != current_user_id:
                raise AuthorizationError("Not authorized to update this universe")

            data = request.get_json()
            if not all(k in data for k in ("title", "description")):
                raise ValidationError("Missing required fields")

            universe.add_story_point(data)
            db.add(universe)
            db.commit()

            # Notify connected clients about the new story point
            socketio.emit(
                "story_changed",
                {
                    "universe_id": str(universe_id),
                    "story_points": universe.story_points,
                },
                room=f"universe_{universe_id}",
            )

            return jsonify(universe.to_dict())
        except (ValidationError, AuthorizationError) as e:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise ValidationError(f"Error adding story point: {str(e)}")


@universe_bp.route(
    "/<uuid:universe_id>/story-points/<int:point_id>/", methods=["DELETE"]
)
@jwt_required()
def remove_story_point(universe_id, point_id):
    """Remove a story point from a universe."""
    current_user_id = get_jwt_identity()

    with get_db() as db:
        try:
            universe_repo = UniverseRepository(db)
            universe = universe_repo.get_universe_by_id(str(universe_id))
            if not universe:
                raise ValidationError("Universe not found")

            if universe.user_id != current_user_id:
                raise AuthorizationError("Not authorized to update this universe")

            universe.remove_story_point(point_id)
            db.add(universe)
            db.commit()

            # Notify connected clients about the story point removal
            socketio.emit(
                "story_changed",
                {
                    "universe_id": str(universe_id),
                    "story_points": universe.story_points,
                },
                room=f"universe_{universe_id}",
            )

            return "", 204
        except (ValidationError, AuthorizationError) as e:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise ValidationError(f"Error removing story point: {str(e)}")


# WebSocket event handlers
@socketio.on("join_universe")
def on_join_universe(data):
    """Join a universe room."""
    try:
        # Get token from socket auth or data
        token = None
        if hasattr(request, "headers") and "Authorization" in request.headers:
            token = request.headers["Authorization"].replace("Bearer ", "")
        elif "token" in data:
            token = data["token"]

        if not token:
            raise AuthenticationError("No authentication token provided")

        # Verify token
        try:
            from flask_jwt_extended import decode_token

            decoded_token = decode_token(token)
            current_user_id = decoded_token["sub"]
        except Exception as e:
            raise AuthenticationError(f"Invalid token: {str(e)}")

        universe_id = data.get("universe_id")
        if not universe_id:
            raise ValidationError("Universe ID is required")

        with get_db() as db:
            universe = db.query(Universe).filter_by(id=universe_id).first()

            if not universe:
                raise ValidationError("Universe not found")

            # Check if user has access
            if not (
                universe.is_public or str(universe.user_id) == str(current_user_id)
            ):
                raise AuthorizationError("Not authorized to access this universe")

            room = f"universe_{universe_id}"
            socketio.join_room(room)

            # Emit join event to room
            socketio.emit(
                "user_joined",
                {
                    "user_id": current_user_id,
                    "universe_id": universe_id,
                    "timestamp": datetime.utcnow().isoformat(),
                },
                room=room,
            )

    except Exception as e:
        error_msg = str(e)
        socketio.emit(
            "error", {"message": error_msg, "code": "join_failed"}, room=request.sid
        )


@socketio.on("leave_universe")
def on_leave_universe(data):
    """Leave a universe room."""
    try:
        # Get token from socket auth or data
        token = None
        if hasattr(request, "headers") and "Authorization" in request.headers:
            token = request.headers["Authorization"].replace("Bearer ", "")
        elif "token" in data:
            token = data["token"]

        if not token:
            raise AuthenticationError("No authentication token provided")

        # Verify token
        try:
            from flask_jwt_extended import decode_token

            decoded_token = decode_token(token)
            current_user_id = decoded_token["sub"]
        except Exception as e:
            raise AuthenticationError(f"Invalid token: {str(e)}")

        universe_id = data.get("universe_id")
        if not universe_id:
            return

        room = f"universe_{universe_id}"
        socketio.leave_room(room)

        # Emit leave event to room
        socketio.emit(
            "user_left",
            {
                "user_id": current_user_id,
                "universe_id": universe_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
            room=room,
        )

    except Exception as e:
        error_msg = str(e)
        socketio.emit(
            "error", {"message": error_msg, "code": "leave_failed"}, room=request.sid
        )
