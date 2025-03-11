from flask import Blueprint, request, jsonify
import time

# Create blueprint
universe_bp = Blueprint("universe", __name__, url_prefix="/api/universes")

# Mock database for testing
universes_db = [
    {
        "id": 1,
        "name": "Sample Universe",
        "description": "A sample universe for testing",
        "is_public": True,
        "created_at": int(time.time()),
        "user_id": 1
    }
]

# Get all universes
@universe_bp.route("/", methods=["GET"])
def get_all_universes():
    return jsonify({
        "status": "success",
        "data": {"universes": universes_db}
    }), 200

# Get a specific universe
@universe_bp.route("/<int:universe_id>", methods=["GET"])
def get_universe(universe_id):
    universe = next((u for u in universes_db if u["id"] == universe_id), None)

    if not universe:
        return jsonify({"status": "error", "message": "Universe not found"}), 404

    return jsonify({
        "status": "success",
        "data": {"universe": universe}
    }), 200

# Create a new universe
@universe_bp.route("/", methods=["POST"])
def create_universe():
    data = request.get_json()

    if not data.get("name"):
        return jsonify({"status": "error", "message": "Name is required"}), 400

    # Create new universe with a new ID
    new_id = max([u["id"] for u in universes_db], default=0) + 1
    new_universe = {
        "id": new_id,
        "name": data.get("name"),
        "description": data.get("description", ""),
        "is_public": data.get("is_public", False),
        "created_at": int(time.time()),
        "user_id": 1  # Default user ID for testing
    }

    universes_db.append(new_universe)

    return jsonify({
        "status": "success",
        "message": "Universe created successfully",
        "data": {"universe": new_universe}
    }), 201

# Update a universe
@universe_bp.route("/<int:universe_id>", methods=["PUT"])
def update_universe(universe_id):
    data = request.get_json()
    universe = next((u for u in universes_db if u["id"] == universe_id), None)

    if not universe:
        return jsonify({"status": "error", "message": "Universe not found"}), 404

    # Update fields
    if "name" in data:
        universe["name"] = data["name"]
    if "description" in data:
        universe["description"] = data["description"]
    if "is_public" in data:
        universe["is_public"] = data["is_public"]

    return jsonify({
        "status": "success",
        "message": "Universe updated successfully",
        "data": {"universe": universe}
    }), 200

# Delete a universe
@universe_bp.route("/<int:universe_id>", methods=["DELETE"])
def delete_universe(universe_id):
    global universes_db
    universe = next((u for u in universes_db if u["id"] == universe_id), None)

    if not universe:
        return jsonify({"status": "error", "message": "Universe not found"}), 404

    # Remove the universe
    universes_db = [u for u in universes_db if u["id"] != universe_id]

    return jsonify({
        "status": "success",
        "message": "Universe deleted successfully"
    }), 200
