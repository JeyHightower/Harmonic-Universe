from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.universe import Universe
from ..models.user import User
from .. import db
import json
from sqlalchemy import or_
from ..auth import get_current_user
from ..schemas.universe import UniverseCreate, UniverseUpdate, UniverseResponse
from flask_login import current_user, login_required
from http import HTTPStatus

universe_bp = Blueprint('universe', __name__)

@universe_bp.route('/universes', methods=['POST'])
@login_required
def create_universe():
    """Create a new universe."""
    try:
        data = request.get_json()
        universe_data = UniverseCreate(**data)

        universe = Universe(
            name=universe_data.name,
            description=universe_data.description,
            is_public=universe_data.is_public,
            allow_guests=universe_data.allow_guests,
            user_id=current_user.id,
            music_parameters=universe_data.music_parameters.dict() if universe_data.music_parameters else {},
            visual_parameters=universe_data.visual_parameters.dict() if universe_data.visual_parameters else {}
        )

        db.session.add(universe)
        db.session.commit()

        return jsonify(UniverseResponse.from_orm(universe).dict()), HTTPStatus.CREATED

    except Exception as e:
        current_app.logger.error(f"Error creating universe: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@universe_bp.route('/universes/<int:universe_id>', methods=['PUT'])
@login_required
def update_universe(universe_id: int):
    """Update an existing universe."""
    try:
        universe = Universe.query.get_or_404(universe_id)

        if not universe.can_user_edit(current_user.id):
            return jsonify({"error": "Unauthorized"}), HTTPStatus.FORBIDDEN

        data = request.get_json()
        update_data = UniverseUpdate(**data)

        if update_data.name is not None:
            universe.name = update_data.name
        if update_data.description is not None:
            universe.description = update_data.description
        if update_data.is_public is not None:
            universe.is_public = update_data.is_public
        if update_data.allow_guests is not None:
            universe.allow_guests = update_data.allow_guests
        if update_data.music_parameters is not None:
            universe.music_parameters = update_data.music_parameters.dict()
        if update_data.visual_parameters is not None:
            universe.visual_parameters = update_data.visual_parameters.dict()

        db.session.commit()

        return jsonify(UniverseResponse.from_orm(universe).dict())

    except Exception as e:
        current_app.logger.error(f"Error updating universe: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@universe_bp.route('/universes/<int:universe_id>', methods=['GET'])
def get_universe(universe_id: int):
    """Get a specific universe."""
    universe = Universe.query.get_or_404(universe_id)

    if not universe.can_user_access(current_user.id if current_user.is_authenticated else None):
        return jsonify({"error": "Unauthorized"}), HTTPStatus.FORBIDDEN

    return jsonify(UniverseResponse.from_orm(universe).dict())

@universe_bp.route('/universes', methods=['GET'])
def list_universes():
    """List all accessible universes."""
    universes = Universe.get_accessible_universes(
        current_user.id if current_user.is_authenticated else None
    )
    return jsonify([UniverseResponse.from_orm(u).dict() for u in universes])

@universe_bp.route('/universes/<int:universe_id>/parameters', methods=['PATCH'])
@login_required
def update_parameters(universe_id: int):
    """Update universe parameters."""
    try:
        universe = Universe.query.get_or_404(universe_id)

        if not universe.can_user_edit(current_user.id):
            return jsonify({"error": "Unauthorized"}), HTTPStatus.FORBIDDEN

        data = request.get_json()
        update_data = UniverseUpdate(**data)

        if update_data.music_parameters is not None:
            universe.music_parameters = update_data.music_parameters.dict()
        if update_data.visual_parameters is not None:
            universe.visual_parameters = update_data.visual_parameters.dict()

        db.session.commit()

        return jsonify(UniverseResponse.from_orm(universe).dict())

    except Exception as e:
        current_app.logger.error(f"Error updating parameters: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@universe_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_universes():
    """Get universes owned by the current user"""
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'User not found'}), 404

    universes = Universe.query.filter_by(creator_id=current_user.id).all()
    return jsonify({
        'universes': [universe.to_dict() for universe in universes]
    }), 200

@universe_bp.route('/owned', methods=['GET'])
@jwt_required()
def get_owned_universes():
    """Get universes owned by the current user"""
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'User not found'}), 404

    universes = Universe.query.filter_by(creator_id=current_user.id).all()
    return jsonify({
        'universes': [universe.to_dict() for universe in universes]
    }), 200

@universe_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_universe(id):
    """Delete a universe"""
    universe = Universe.query.get_or_404(id)
    user_id = get_jwt_identity()

    if not universe.can_modify(user_id):
        return {"error": "Access denied"}, 403

    db.session.delete(universe)
    db.session.commit()
    return '', 204

@universe_bp.route('/<int:id>/parameters', methods=['PUT'])
@jwt_required()
def update_parameters_old(id):
    """Update universe parameters"""
    universe = Universe.query.get_or_404(id)
    user_id = get_jwt_identity()

    if not universe.can_modify(user_id):
        return {"error": "Access denied"}, 403

    data = request.get_json()
    universe.parameters.update(data['parameters'])
    db.session.commit()

    return universe.to_dict(), 200

@universe_bp.route('/<int:id>/collaborators', methods=['POST'])
@jwt_required()
def add_collaborator(id):
    """Add a collaborator to a universe"""
    try:
        user_id = get_jwt_identity()
        universe = Universe.query.get_or_404(id)

        if not universe.can_modify(user_id):
            return {'error': 'Not authorized'}, 403

        data = request.get_json()
        if not data or 'email' not in data:
            return {'error': 'Email is required'}, 400

        collaborator = User.query.filter_by(email=data['email']).first()
        if not collaborator:
            return {'error': 'User not found'}, 404

        if collaborator.id == user_id:
            return {'error': 'Cannot add yourself as collaborator'}, 400

        if collaborator in universe.collaborators:
            return {'error': 'User is already a collaborator'}, 400

        universe.collaborators.append(collaborator)
        db.session.commit()

        return {'message': 'Collaborator added successfully'}, 201

    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 422

@universe_bp.route('/<int:id>/collaborators', methods=['GET'])
@jwt_required()
def get_collaborators(id):
    """Get all collaborators for a universe"""
    try:
        user_id = get_jwt_identity()
        universe = Universe.query.get_or_404(id)

        if not universe.can_access(user_id):
            return {'error': 'Not authorized'}, 403

        collaborators = [u.to_dict() for u in universe.collaborators]
        return {'collaborators': collaborators}, 200

    except Exception as e:
        return {'error': str(e)}, 422

@universe_bp.route('/<int:id>/collaborators/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_collaborator(id, user_id):
    """Remove a collaborator from a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get_or_404(id)

        if not universe.can_modify(current_user_id):
            return {'error': 'Not authorized'}, 403

        collaborator = User.query.get_or_404(user_id)
        if collaborator not in universe.collaborators:
            return {'error': 'User is not a collaborator'}, 404

        universe.collaborators.remove(collaborator)
        db.session.commit()

        return {'message': 'Collaborator removed successfully'}, 200

    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 422
