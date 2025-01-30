from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from ..models import Universe


def require_universe_access(require_ownership=False):
    """Decorator to check if user has access to a universe."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            universe_id = kwargs.get("universe_id")

            if not universe_id:
                return jsonify({"error": "Universe ID is required"}), 400

            universe = Universe.query.get(universe_id)
            if not universe:
                return jsonify({"error": "Universe not found"}), 404

            # Check access
            if require_ownership and universe.user_id != current_user_id:
                return jsonify({"error": "Unauthorized"}), 403
            elif not universe.is_public and universe.user_id != current_user_id:
                return jsonify({"error": "Unauthorized"}), 403

            return fn(*args, **kwargs)

        return wrapper

    return decorator


def validate_json_payload(*required_fields):
    """Decorator to validate JSON payload."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            data = request.get_json()
            if not data:
                return jsonify({"error": "No JSON data provided"}), 400

            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return (
                    jsonify(
                        {"error": "Missing required fields", "fields": missing_fields}
                    ),
                    400,
                )

            return fn(*args, **kwargs)

        return wrapper

    return decorator
