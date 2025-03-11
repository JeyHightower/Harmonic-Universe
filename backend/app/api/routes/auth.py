from flask import Blueprint, request, jsonify
import time

# Create blueprint without url_prefix (will be handled in app.py)
auth_bp = Blueprint("auth_routes", __name__, url_prefix="/api/auth")

# Mock user database for testing
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

# Register a new user
@auth_bp.route("/register", methods=["POST"])
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
@auth_bp.route("/login", methods=["POST"])
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
@auth_bp.route("/demo-login", methods=["POST"])
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
@auth_bp.route("/logout", methods=["POST"])
def logout():
    # In a real app, this would invalidate the token
    return jsonify({
        "status": "success",
        "message": "Successfully logged out"
    }), 200

# Get current user info
@auth_bp.route("/me", methods=["GET"])
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
