from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import time

# Create Flask application
app = Flask(__name__, static_folder="static")
app.debug = True  # Enable debug mode

# Centralized CORS configuration
cors_config = {
    "origins": os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://localhost:5000,http://localhost:5001"
    ).split(","),
    "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    "allow_headers": [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
    ],
    "expose_headers": ["Content-Length", "Content-Type"],
    "supports_credentials": True,
    "max_age": int(os.environ.get("CORS_MAX_AGE", "600")),  # 10 minutes
}

# Configure CORS with specific settings
CORS(
    app,
    resources={r"/*": cors_config},
)

# Mock databases
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

users_db = [
    {
        "id": 1,
        "username": "demo",
        "email": "demo@example.com",
        "password": "demo123",  # In a real app, this would be hashed
        "is_active": True,
        "created_at": int(time.time())
    }
]

# Root route for testing
@app.route('/')
def index():
    return jsonify({
        "message": "Welcome to Harmonic Universe API",
        "version": "1.0.0",
        "status": "running"
    })

# Health check endpoint
@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": int(time.time()),
        "version": "1.0.0"
    }), 200

# Test endpoint
@app.route('/api/test')
def test():
    return jsonify({
        "message": "API is working"
    }), 200

# ===== UNIVERSE ROUTES =====

# Get all universes
@app.route('/api/universes', methods=["GET"])
def get_all_universes():
    return jsonify({
        "status": "success",
        "data": {"universes": universes_db}
    }), 200

# Get a specific universe
@app.route('/api/universes/<int:universe_id>', methods=["GET"])
def get_universe(universe_id):
    universe = next((u for u in universes_db if u["id"] == universe_id), None)

    if not universe:
        return jsonify({"status": "error", "message": "Universe not found"}), 404

    return jsonify({
        "status": "success",
        "data": {"universe": universe}
    }), 200

# Create a new universe
@app.route('/api/universes', methods=["POST"])
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
@app.route('/api/universes/<int:universe_id>', methods=["PUT"])
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
@app.route('/api/universes/<int:universe_id>', methods=["DELETE"])
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

# ===== SCENE ROUTES =====

# Get all scenes
@app.route('/api/scenes', methods=["GET"])
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
@app.route('/api/scenes/<int:scene_id>', methods=["GET"])
def get_scene(scene_id):
    scene = next((s for s in scenes_db if s["id"] == scene_id), None)

    if not scene:
        return jsonify({"status": "error", "message": "Scene not found"}), 404

    return jsonify({
        "status": "success",
        "data": {"scene": scene}
    }), 200

# Create a new scene
@app.route('/api/scenes', methods=["POST"])
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
@app.route('/api/scenes/<int:scene_id>', methods=["PUT"])
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
@app.route('/api/scenes/<int:scene_id>', methods=["DELETE"])
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

# ===== AUTH ROUTES =====

# Register a new user
@app.route('/api/auth/register', methods=["POST"])
def register():
    data = request.get_json()

    # Validate required fields
    if not all(k in data for k in ("email", "password", "username")):
        missing = [k for k in ("email", "password", "username") if k not in data]
        return jsonify({
            "status": "error",
            "message": f"Missing required fields: {', '.join(missing)}"
        }), 400

    # Check if user with this email already exists
    if any(u["email"] == data["email"] for u in users_db):
        return jsonify({
            "status": "error",
            "message": "Email already registered"
        }), 400

    # Check if username is taken
    if any(u["username"] == data["username"] for u in users_db):
        return jsonify({
            "status": "error",
            "message": "Username already taken"
        }), 400

    # Create a new user
    new_id = max([u["id"] for u in users_db], default=0) + 1
    new_user = {
        "id": new_id,
        "username": data["username"],
        "email": data["email"],
        "password": data["password"],  # In a real app, this would be hashed
        "is_active": True,
        "created_at": int(time.time())
    }

    users_db.append(new_user)

    # Return user info without password
    user_response = {k: v for k, v in new_user.items() if k != "password"}

    return jsonify({
        "status": "success",
        "message": "User registered successfully",
        "data": {"user": user_response}
    }), 201

# Login user
@app.route('/api/auth/login', methods=["POST"])
def login():
    data = request.get_json()

    # Validate required fields
    if not all(k in data for k in ("email", "password")):
        return jsonify({
            "status": "error",
            "message": "Missing required fields: email, password"
        }), 400

    # Find user by email
    user = next((u for u in users_db if u["email"] == data["email"]), None)

    # Check if user exists and password matches
    if not user or user["password"] != data["password"]:
        return jsonify({
            "status": "error",
            "message": "Invalid email or password"
        }), 401

    # Check if user is active
    if not user["is_active"]:
        return jsonify({
            "status": "error",
            "message": "User account is inactive"
        }), 401

    # Return user info without password
    user_response = {k: v for k, v in user.items() if k != "password"}

    return jsonify({
        "status": "success",
        "message": "Login successful",
        "data": {
            "user": user_response,
            "token": f"mock-token-{user['id']}",  # In a real app, this would be a JWT
            "access_token": f"mock-token-{user['id']}",  # For API consistency
            "token_type": "bearer"
        }
    }), 200

# Demo login
@app.route('/auth/demo-login', methods=["POST"])
def demo_login():
    # Get or create demo user
    demo_user = next((u for u in users_db if u["email"] == "demo@example.com"), None)

    if not demo_user:
        # Create demo user if it doesn't exist
        new_id = max([u["id"] for u in users_db], default=0) + 1
        demo_user = {
            "id": new_id,
            "username": "demo",
            "email": "demo@example.com",
            "password": "demo123",
            "is_active": True,
            "created_at": int(time.time())
        }
        users_db.append(demo_user)

    # Make sure demo user is active
    demo_user["is_active"] = True

    # Return user info without password
    user_response = {k: v for k, v in demo_user.items() if k != "password"}

    return jsonify({
        "token": "demo-token",
        "user": {
            "id": demo_user["id"],
            "username": demo_user["username"],
            "email": demo_user["email"]
        }
    }), 200

# Logout user
@app.route('/api/auth/logout', methods=["POST"])
def logout():
    # In a real app, this would invalidate the token
    return jsonify({
        "status": "success",
        "message": "Successfully logged out"
    }), 200

# Get current user info
@app.route('/api/auth/me', methods=["GET"])
def get_me():
    # For demo purposes, return the demo user
    demo_user = next((u for u in users_db if u["email"] == "demo@example.com"), None)

    if not demo_user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404

    # Return user info without password
    user_response = {k: v for k, v in demo_user.items() if k != "password"}

    return jsonify({
        "status": "success",
        "data": {"user": user_response}
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Not Found",
        "message": str(error)
    }), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({
        "error": "Internal Server Error",
        "message": str(error)
    }), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
