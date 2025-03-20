from flask import Blueprint, request, jsonify
import time

# Create blueprint
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

# Get all scenes
@scenes_bp.route("/", methods=["GET"])
def get_all_scenes():
    # Optional filter by universe_id
    universe_id = request.args.get("universe_id")

    if universe_id:
        try:
            universe_id = int(universe_id)
            filtered_scenes = [s for s in scenes_db if s["universe_id"] == universe_id]
            return jsonify({
                "status": "success",
                "data": {"scenes": filtered_scenes}
            }), 200
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid universe ID"}), 400

    return jsonify({
        "status": "success",
        "data": {"scenes": scenes_db}
    }), 200

# Get a specific scene
@scenes_bp.route("/<int:scene_id>", methods=["GET"])
def get_scene(scene_id):
    scene = next((s for s in scenes_db if s["id"] == scene_id), None)

    if not scene:
        return jsonify({"status": "error", "message": "Scene not found"}), 404

    return jsonify({
        "status": "success",
        "data": {"scene": scene}
    }), 200

# Create a new scene
@scenes_bp.route("/", methods=["POST"])
def create_scene():
    data = request.get_json()

    if not data.get("title"):
        return jsonify({"status": "error", "message": "Title is required"}), 400

    if not data.get("universe_id"):
        return jsonify({"status": "error", "message": "Universe ID is required"}), 400

    # Calculate the next order value for this universe
    universe_id = data.get("universe_id")
    universe_scenes = [s for s in scenes_db if s["universe_id"] == universe_id]
    next_order = len(universe_scenes) + 1

    # Create new scene with a new ID
    new_id = max([s["id"] for s in scenes_db], default=0) + 1
    new_scene = {
        "id": new_id,
        "title": data.get("title"),
        "description": data.get("description", ""),
        "universe_id": universe_id,
        "order": next_order,
        "created_at": int(time.time()),
        "scene_type": data.get("scene_type", "standard"),
        "is_active": data.get("is_active", True),
        "duration": data.get("duration", 60.0)
    }

    scenes_db.append(new_scene)

    return jsonify({
        "status": "success",
        "message": "Scene created successfully",
        "data": {"scene": new_scene}
    }), 201

# Update a scene
@scenes_bp.route("/<int:scene_id>", methods=["PUT"])
def update_scene(scene_id):
    data = request.get_json()
    scene = next((s for s in scenes_db if s["id"] == scene_id), None)

    if not scene:
        return jsonify({"status": "error", "message": "Scene not found"}), 404

    # Update fields
    if "title" in data:
        scene["title"] = data["title"]
    if "description" in data:
        scene["description"] = data["description"]
    if "scene_type" in data:
        scene["scene_type"] = data["scene_type"]
    if "is_active" in data:
        scene["is_active"] = data["is_active"]
    if "duration" in data:
        scene["duration"] = data["duration"]

    return jsonify({
        "status": "success",
        "message": "Scene updated successfully",
        "data": {"scene": scene}
    }), 200

# Delete a scene
@scenes_bp.route("/<int:scene_id>", methods=["DELETE"])
def delete_scene(scene_id):
    global scenes_db
    scene = next((s for s in scenes_db if s["id"] == scene_id), None)

    if not scene:
        return jsonify({"status": "error", "message": "Scene not found"}), 404

    # Get the universe ID and order of the scene to be deleted
    universe_id = scene["universe_id"]
    deleted_order = scene["order"]

    # Remove the scene
    scenes_db = [s for s in scenes_db if s["id"] != scene_id]

    # Reorder remaining scenes in the same universe
    for s in scenes_db:
        if s["universe_id"] == universe_id and s["order"] > deleted_order:
            s["order"] -= 1

    return jsonify({
        "status": "success",
        "message": "Scene deleted successfully"
    }), 200
