from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.schemas.universe import UniverseSchema
from app.services.universe_service import UniverseService

universes = Blueprint("universes", __name__)
universe_schema = UniverseSchema()
universe_service = UniverseService()


@universes.route("/api/universes", methods=["POST"])
@jwt_required()
def create_universe():
    """Create a new universe."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        universe = universe_service.create_universe(current_user_id, data)
        return jsonify(universe_schema.dump(universe)), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Failed to create universe"}), 500


@universes.route("/api/universes/<int:universe_id>", methods=["GET"])
@jwt_required()
def get_universe(universe_id):
    """Get a specific universe by ID."""
    try:
        universe = universe_service.get_universe(universe_id)
        if not universe:
            return jsonify({"error": "Universe not found"}), 404
        return jsonify(universe_schema.dump(universe))
    except Exception as e:
        return jsonify({"error": "Failed to fetch universe"}), 500


@universes.route("/api/universes/<int:universe_id>", methods=["PUT"])
@jwt_required()
def update_universe(universe_id):
    """Update a specific universe."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        universe = universe_service.update_universe(universe_id, current_user_id, data)
        if not universe:
            return jsonify({"error": "Universe not found"}), 404
        return jsonify(universe_schema.dump(universe))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Failed to update universe"}), 500


@universes.route("/api/universes/<int:universe_id>", methods=["DELETE"])
@jwt_required()
def delete_universe(universe_id):
    """Delete a specific universe."""
    current_user_id = get_jwt_identity()

    try:
        universe_service.delete_universe(universe_id, current_user_id)
        return "", 204
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Failed to delete universe"}), 500
