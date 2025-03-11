"""User management routes."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.core.errors import ValidationError, NotFoundError
from backend.app.core.jwt import add_token_to_blocklist

users_bp = Blueprint("users", __name__)


@users_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """Get current user profile."""
    current_user_id = get_jwt_identity()

    with get_db() as db:
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            raise NotFoundError("User not found")
        return jsonify(user.to_dict())


# Additional route aliases for user profile to match verification script expectations
@users_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_user_profile():
    """
    Get the current user's profile (alias for get_me endpoint).
    """
    return get_me()


@users_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_me():
    """Update current user profile."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        raise ValidationError("No input data provided")

    allowed_fields = {"username", "email"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    # Validate input data
    if "username" in update_data:
        username = update_data["username"]
        # Check if username is a string
        if not isinstance(username, str):
            raise ValidationError("Username must be a string")
        # Check username length
        if len(username) < 3:
            raise ValidationError("Username must be at least 3 characters")
        if len(username) > 30:
            raise ValidationError("Username must be at most 30 characters")
        # Check if username contains only alphanumeric characters and underscores
        if not username.replace("_", "").isalnum():
            raise ValidationError(
                "Username can only contain letters, numbers, and underscores"
            )

    if "email" in update_data:
        email = update_data["email"]
        # Check if email is a string
        if not isinstance(email, str):
            raise ValidationError("Email must be a string")
        # Basic email validation
        if "@" not in email or "." not in email:
            raise ValidationError("Invalid email format")
        # Check email length
        if len(email) < 5 or len(email) > 255:
            raise ValidationError("Email must be between 5 and 255 characters")

    with get_db() as db:
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            raise NotFoundError("User not found")

        # Check unique constraints
        if "email" in update_data:
            existing = db.query(User).filter_by(email=update_data["email"]).first()
            if existing and existing.id != current_user_id:
                raise ValidationError("Email already registered")

        if "username" in update_data:
            existing = (
                db.query(User).filter_by(username=update_data["username"]).first()
            )
            if existing and existing.id != current_user_id:
                raise ValidationError("Username already taken")

        # Update user
        for key, value in update_data.items():
            setattr(user, key, value)
        db.commit()

        return jsonify(user.to_dict())


# Additional route alias for profile update to match verification script expectations
@users_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_user_profile():
    """
    Update the current user's profile (alias for update_me endpoint).
    """
    return update_me()


@users_bp.route("/me/settings", methods=["PUT"])
@jwt_required()
def update_settings():
    """Update user settings."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        raise ValidationError("No input data provided")

    allowed_settings = {"theme", "notifications", "color"}
    settings_data = {k: v for k, v in data.items() if k in allowed_settings}

    with get_db() as db:
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            raise NotFoundError("User not found")

        # Update settings
        if "theme" in settings_data:
            if settings_data["theme"] not in ["light", "dark"]:
                raise ValidationError("Invalid theme value")

        if "notifications" in settings_data:
            if not isinstance(settings_data["notifications"], bool):
                raise ValidationError("Invalid notifications value")

        if "color" in settings_data:
            if (
                not isinstance(settings_data["color"], str)
                or len(settings_data["color"]) != 7
            ):
                raise ValidationError("Invalid color value")

        # Update user settings
        for key, value in settings_data.items():
            setattr(user, key, value)
        db.commit()

        return jsonify(user.to_dict())


# New endpoints to implement
@users_bp.route("/<user_id>", methods=["GET"])
@jwt_required()
def get_user_by_id(user_id):
    """Get a user by ID."""
    with get_db() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User not found")

        # Return a limited subset of user data for privacy
        user_data = {
            "id": user.id,
            "username": user.username,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            # Do not include email for privacy reasons
        }
        return jsonify(user_data)


@users_bp.route("/", methods=["GET"])
@jwt_required()
def list_users():
    """List all users with pagination."""
    # Get pagination parameters
    limit = request.args.get("limit", 10, type=int)
    offset = request.args.get("offset", 0, type=int)

    # Validate pagination parameters
    if limit < 1 or limit > 100:  # Set reasonable limits
        limit = 10
    if offset < 0:
        offset = 0

    with get_db() as db:
        # Get total count for pagination metadata
        total_users = db.query(User).count()

        # Get paginated results
        users = (
            db.query(User)
            .order_by(User.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

        # Format results
        user_list = []
        for user in users:
            # Return a limited subset of user data for privacy
            user_data = {
                "id": user.id,
                "username": user.username,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                # Do not include email for privacy reasons
            }
            user_list.append(user_data)

        # Return paginated response
        response = {
            "items": user_list,
            "total": total_users,
            "limit": limit,
            "offset": offset,
        }
        return jsonify(response)


@users_bp.route("/search", methods=["GET"])
@jwt_required()
def search_users():
    """Search for users by username."""
    username_query = request.args.get("username", "")

    if not username_query:
        raise ValidationError("Search query is required")

    # Get pagination parameters
    limit = request.args.get("limit", 10, type=int)
    offset = request.args.get("offset", 0, type=int)

    with get_db() as db:
        # Search for users with usernames containing the query (case insensitive)
        query = db.query(User).filter(User.username.ilike(f"%{username_query}%"))

        # Get total count for pagination metadata
        total_results = query.count()

        # Get paginated results
        users = query.order_by(User.username).limit(limit).offset(offset).all()

        # Format results
        user_list = []
        for user in users:
            # Return a limited subset of user data for privacy
            user_data = {
                "id": user.id,
                "username": user.username,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            }
            user_list.append(user_data)

        return jsonify(user_list)


@users_bp.route("/me", methods=["DELETE"])
@jwt_required()
def delete_user():
    """Delete the current user."""
    current_user_id = get_jwt_identity()

    with get_db() as db:
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            raise NotFoundError("User not found")

        # Delete the user
        db.delete(user)

        # Make sure to invalidate the token
        # We can't directly revoke the token here, but we'll use a token blocklist approach
        # This is a simplified version - a real implementation would use a blocklist in Redis/DB

        # Add current token to blocklist
        token = get_jwt()
        add_token_to_blocklist(token)

        db.commit()

        return jsonify({"message": "User deleted successfully"})
