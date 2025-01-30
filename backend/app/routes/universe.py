from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.universe import Universe
from ..models.user import User
from .. import db
import json
from sqlalchemy import or_, select
from ..auth import get_current_user
from ..schemas.universe import UniverseCreate, UniverseUpdate, UniverseResponse
from flask_login import current_user, login_required
from http import HTTPStatus
from ..utils.auth import check_universe_access

bp = Blueprint('universe', __name__)

@bp.route('/universes', methods=['POST'])
@jwt_required()
def create_universe():
    """Create a new universe."""
    try:
        user_id = get_jwt_identity()
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid user ID format"}), HTTPStatus.BAD_REQUEST

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), HTTPStatus.BAD_REQUEST

        # Validate required fields
        if 'name' not in data:
            return jsonify({"error": "Name is required"}), HTTPStatus.BAD_REQUEST

        universe = Universe(
            name=data['name'],
            description=data.get('description', ''),
            user_id=user_id,
            is_public=data.get('is_public', True),
            max_participants=data.get('max_participants', 10),
            music_parameters=data.get('music_parameters', {}),
            visual_parameters=data.get('visual_parameters', {})
        )

        db.session.add(universe)
        db.session.commit()

        response_data = universe.to_dict()
        return jsonify(response_data), HTTPStatus.CREATED

    except Exception as e:
        current_app.logger.error(f"Error creating universe: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@bp.route('/universes/<universe_id>', methods=['PUT'])
@jwt_required()
def update_universe(universe_id: str):
    """Update an existing universe."""
    try:
        try:
            universe_id = int(universe_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid universe ID format"}), HTTPStatus.BAD_REQUEST

        stmt = select(Universe).filter_by(id=universe_id)
        universe = db.session.execute(stmt).unique().scalar_one_or_none()

        if not universe:
            return jsonify({"error": "Universe not found"}), HTTPStatus.NOT_FOUND

        user_id = get_jwt_identity()
        if not universe.can_user_edit(int(user_id)):
            return jsonify({"error": "Unauthorized"}), HTTPStatus.FORBIDDEN

        data = request.get_json()

        if 'name' in data:
            universe.name = data['name']
        if 'description' in data:
            universe.description = data['description']
        if 'is_public' in data:
            universe.is_public = data['is_public']
        if 'max_participants' in data:
            universe.max_participants = data['max_participants']
        if 'music_parameters' in data:
            universe.music_parameters = data['music_parameters']
        if 'visual_parameters' in data:
            universe.visual_parameters = data['visual_parameters']

        db.session.commit()

        return jsonify(universe.to_dict())

    except Exception as e:
        current_app.logger.error(f"Error updating universe: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@bp.route('/universes/<universe_id>', methods=['GET'])
@jwt_required(optional=True)
def get_universe(universe_id: str):
    """Get a specific universe."""
    try:
        try:
            universe_id = int(universe_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid universe ID format"}), HTTPStatus.BAD_REQUEST

        stmt = select(Universe).filter_by(id=universe_id)
        universe = db.session.execute(stmt).unique().scalar_one_or_none()

        if not universe:
            return jsonify({"error": "Universe not found"}), HTTPStatus.NOT_FOUND

        user_id = get_jwt_identity()
        if not universe.can_user_access(int(user_id) if user_id else None):
            return jsonify({"error": "Unauthorized"}), HTTPStatus.FORBIDDEN

        return jsonify(universe.to_dict())
    except Exception as e:
        current_app.logger.error(f"Error getting universe: {str(e)}")
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@bp.route('/universes', methods=['GET'])
@jwt_required(optional=True)
def list_universes():
    """List all accessible universes."""
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id) if user_id else None

        stmt = select(Universe).where(
            (Universe.is_public == True) | (Universe.user_id == user_id)
        )
        universes = db.session.execute(stmt).unique().scalars().all()
        return jsonify({
            "universes": [u.to_dict() for u in universes]
        }), HTTPStatus.OK
    except Exception as e:
        current_app.logger.error(f"Error listing universes: {str(e)}")
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@bp.route('/universes/<universe_id>/parameters', methods=['PATCH'])
@jwt_required()
def update_parameters(universe_id: str):
    """Update universe parameters."""
    try:
        try:
            universe_id = int(universe_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid universe ID format"}), HTTPStatus.BAD_REQUEST

        stmt = select(Universe).filter_by(id=universe_id)
        universe = db.session.execute(stmt).unique().scalar_one_or_none()

        if not universe:
            return jsonify({"error": "Universe not found"}), HTTPStatus.NOT_FOUND

        user_id = get_jwt_identity()
        if not universe.can_user_edit(int(user_id)):
            return jsonify({"error": "Unauthorized"}), HTTPStatus.FORBIDDEN

        data = request.get_json()

        if 'music_parameters' in data:
            universe.music_parameters.update(data['music_parameters'])
        if 'visual_parameters' in data:
            universe.visual_parameters.update(data['visual_parameters'])

        db.session.commit()

        return jsonify(universe.to_dict())
    except Exception as e:
        current_app.logger.error(f"Error updating universe parameters: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_universes():
    """Get universes where user is a collaborator."""
    try:
        user_id = get_jwt_identity()
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid user ID format"}), HTTPStatus.BAD_REQUEST

        stmt = select(Universe).join(
            Universe.collaborators
        ).filter(User.id == user_id)
        universes = db.session.execute(stmt).scalars().all()

        return jsonify({
            "universes": [UniverseResponse.from_orm(u).dict() for u in universes]
        }), HTTPStatus.OK

    except Exception as e:
        current_app.logger.error(f"Error getting user universes: {str(e)}")
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@bp.route('/owned', methods=['GET'])
@jwt_required()
def get_owned_universes():
    """Get universes owned by the user."""
    try:
        user_id = get_jwt_identity()
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid user ID format"}), HTTPStatus.BAD_REQUEST

        stmt = select(Universe).filter_by(user_id=user_id)
        universes = db.session.execute(stmt).scalars().all()

        return jsonify({
            "universes": [UniverseResponse.from_orm(u).dict() for u in universes]
        }), HTTPStatus.OK

    except Exception as e:
        current_app.logger.error(f"Error getting owned universes: {str(e)}")
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@bp.route('/universes/<universe_id>', methods=['DELETE'])
@jwt_required()
def delete_universe(universe_id: str):
    """Delete a universe"""
    try:
        try:
            universe_id = int(universe_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid universe ID format"}), HTTPStatus.BAD_REQUEST

        stmt = select(Universe).filter_by(id=universe_id).options(db.joinedload(Universe.collaborators))
        universe = db.session.execute(stmt).unique().scalar_one_or_none()

        if not universe:
            return jsonify({"error": "Universe not found"}), HTTPStatus.NOT_FOUND

        user_id = get_jwt_identity()
        if not check_universe_access(universe, user_id, require_ownership=True):
            return jsonify({"error": "Access denied"}), HTTPStatus.FORBIDDEN

        db.session.delete(universe)
        db.session.commit()
        return '', HTTPStatus.NO_CONTENT
    except Exception as e:
        current_app.logger.error(f"Error deleting universe: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@bp.route('/universes/<universe_id>/collaborators', methods=['GET'])
@jwt_required()
def get_collaborators(universe_id: str):
    """Get all collaborators for a universe"""
    try:
        try:
            universe_id = int(universe_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid universe ID format"}), HTTPStatus.BAD_REQUEST

        stmt = select(Universe).filter_by(id=universe_id)
        universe = db.session.execute(stmt).scalar_one_or_none()

        if not universe:
            return jsonify({"error": "Universe not found"}), HTTPStatus.NOT_FOUND

        user_id = get_jwt_identity()
        if not check_universe_access(universe, user_id):
            return jsonify({"error": "Access denied"}), HTTPStatus.FORBIDDEN

        collaborators = [u.to_dict() for u in universe.collaborators]
        return jsonify({"collaborators": collaborators}), HTTPStatus.OK

    except Exception as e:
        current_app.logger.error(f"Error getting collaborators: {str(e)}")
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@bp.route('/universes/<universe_id>/collaborators/<collaborator_id>', methods=['DELETE'])
@jwt_required()
def remove_collaborator(universe_id: str, collaborator_id: str):
    """Remove a collaborator from a universe"""
    try:
        try:
            universe_id = int(universe_id)
            collaborator_id = int(collaborator_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid ID format"}), HTTPStatus.BAD_REQUEST

        stmt = select(Universe).filter_by(id=universe_id).options(db.joinedload(Universe.collaborators))
        universe = db.session.execute(stmt).unique().scalar_one_or_none()

        if not universe:
            return jsonify({"error": "Universe not found"}), HTTPStatus.NOT_FOUND

        user_id = get_jwt_identity()
        if not check_universe_access(universe, user_id, require_ownership=True):
            return jsonify({"error": "Access denied"}), HTTPStatus.FORBIDDEN

        stmt = select(User).filter_by(id=collaborator_id)
        collaborator = db.session.execute(stmt).scalar_one_or_none()

        if not collaborator:
            return jsonify({"error": "Collaborator not found"}), HTTPStatus.NOT_FOUND

        if collaborator not in universe.collaborators:
            return jsonify({"error": "User is not a collaborator"}), HTTPStatus.NOT_FOUND

        universe.collaborators.remove(collaborator)
        universe.collaborators_count = len(universe.collaborators)
        db.session.commit()

        return '', HTTPStatus.NO_CONTENT

    except Exception as e:
        current_app.logger.error(f"Error removing collaborator: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST

@bp.route('/universes/<universe_id>/collaborators', methods=['POST'])
@jwt_required()
def add_collaborator(universe_id: str):
    """Add a collaborator to a universe"""
    try:
        try:
            universe_id = int(universe_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid universe ID format"}), HTTPStatus.BAD_REQUEST

        stmt = select(Universe).filter_by(id=universe_id).options(db.joinedload(Universe.collaborators))
        universe = db.session.execute(stmt).unique().scalar_one_or_none()

        if not universe:
            return jsonify({"error": "Universe not found"}), HTTPStatus.NOT_FOUND

        user_id = get_jwt_identity()
        if not check_universe_access(universe, user_id, require_ownership=True):
            return jsonify({"error": "Access denied"}), HTTPStatus.FORBIDDEN

        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({"error": "Email is required"}), HTTPStatus.BAD_REQUEST

        stmt = select(User).filter_by(email=data['email'])
        collaborator = db.session.execute(stmt).scalar_one_or_none()

        if not collaborator:
            return jsonify({"error": "User not found"}), HTTPStatus.NOT_FOUND

        if str(collaborator.id) == user_id:
            return jsonify({"error": "Cannot add yourself as collaborator"}), HTTPStatus.BAD_REQUEST

        if collaborator in universe.collaborators:
            return jsonify({"error": "User is already a collaborator"}), HTTPStatus.BAD_REQUEST

        universe.collaborators.append(collaborator)
        universe.collaborators_count = len(universe.collaborators)
        db.session.commit()

        return jsonify({"message": "Collaborator added successfully"}), HTTPStatus.CREATED

    except Exception as e:
        current_app.logger.error(f"Error adding collaborator: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), HTTPStatus.BAD_REQUEST
