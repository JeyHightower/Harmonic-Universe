from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import get_jwt_identity
from app.models.base.user import User


def auto_token(f):
    """Decorator to automatically handle token authentication"""

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "No token provided"}), 401

        try:
            token = auth_header.split(" ")[1]
            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user:
                return jsonify({"error": "User not found"}), 404

            g.current_user = user
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": str(e)}), 401

    return decorated
