from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.collaborator import Collaborator
from app.models.universe import Universe
from app.models.user import User

collaborator_bp = Blueprint("collaborator", __name__)


@collaborator_bp.route(
    "/api/universes/<int:universe_id>/collaborators", methods=["GET"]
)
@jwt_required()
def get_collaborators(universe_id):
    """Get all collaborators for a universe."""
    universe = Universe.query.get_or_404(universe_id)
    current_user_id = get_jwt_identity()

    # Check if user has access to view collaborators
    if not universe.is_public and universe.user_id != current_user_id:
        collab = Collaborator.query.filter_by(
            universe_id=universe_id, user_id=current_user_id
        ).first()
        if not collab:
            return jsonify({"error": "Unauthorized"}), 403

    collaborators = Collaborator.get_universe_collaborators(universe_id)
    return jsonify([c.to_dict() for c in collaborators])


@collaborator_bp.route(
    "/api/universes/<int:universe_id>/collaborators", methods=["POST"]
)
@jwt_required()
def add_collaborator(universe_id):
    """Add a new collaborator to a universe."""
    universe = Universe.query.get_or_404(universe_id)
    current_user_id = get_jwt_identity()

    # Only universe owner can add collaborators
    if universe.user_id != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    user_id = data.get("user_id")
    role = data.get("role", "viewer")

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    # Check if user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Check if collaboration already exists
    existing_collab = Collaborator.query.filter_by(
        universe_id=universe_id, user_id=user_id
    ).first()
    if existing_collab:
        return jsonify({"error": "Collaboration already exists"}), 400

    collaborator = Collaborator(universe_id=universe_id, user_id=user_id, role=role)
    db.session.add(collaborator)
    db.session.commit()

    return jsonify(collaborator.to_dict()), 201


@collaborator_bp.route(
    "/api/universes/<int:universe_id>/collaborators/<int:user_id>", methods=["PUT"]
)
@jwt_required()
def update_collaborator(universe_id, user_id):
    """Update a collaborator's role."""
    universe = Universe.query.get_or_404(universe_id)
    current_user_id = get_jwt_identity()

    # Only universe owner can update collaborators
    if universe.user_id != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    collaborator = Collaborator.query.filter_by(
        universe_id=universe_id, user_id=user_id
    ).first_or_404()

    data = request.get_json()
    role = data.get("role")

    if not role:
        return jsonify({"error": "Role is required"}), 400

    collaborator.role = role
    db.session.commit()

    return jsonify(collaborator.to_dict())


@collaborator_bp.route(
    "/api/universes/<int:universe_id>/collaborators/<int:user_id>", methods=["DELETE"]
)
@jwt_required()
def remove_collaborator(universe_id, user_id):
    """Remove a collaborator from a universe."""
    universe = Universe.query.get_or_404(universe_id)
    current_user_id = get_jwt_identity()

    # Only universe owner can remove collaborators
    if universe.user_id != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    collaborator = Collaborator.query.filter_by(
        universe_id=universe_id, user_id=user_id
    ).first_or_404()

    db.session.delete(collaborator)
    db.session.commit()

    return "", 204


@collaborator_bp.route("/api/users/me/collaborations", methods=["GET"])
@jwt_required()
def get_user_collaborations():
    """Get all universes where the current user is a collaborator."""
    current_user_id = get_jwt_identity()
    collaborations = Collaborator.get_user_collaborations(current_user_id)
    return jsonify([c.to_dict() for c in collaborations])
