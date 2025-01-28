from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.universe import Universe
from ..models.user import User
from .. import db
import json
from sqlalchemy import or_
from ..auth import get_current_user

universe_bp = Blueprint('universe', __name__)

@universe_bp.route('', methods=['GET'])
@jwt_required()
def get_universes():
    """Get all universes accessible to the current user"""
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'User not found'}), 404

    # Get universes where user is creator or has access
    owned_universes = Universe.query.filter_by(creator_id=current_user.id).all()
    accessible_universes = current_user.accessible_universes.all()
    public_universes = Universe.query.filter_by(is_public=True).all()

    # Combine and deduplicate universes
    all_universes = list(set(owned_universes + accessible_universes + public_universes))

    return jsonify({
        'universes': [universe.to_dict() for universe in all_universes]
    }), 200

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

@universe_bp.route('', methods=['POST'])
@jwt_required()
def create_universe():
    """Create a new universe"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        if not data:
            return {'error': 'No data provided'}, 400
        if not data.get('name'):
            return {'error': 'Name is required'}, 400
        if len(data['name']) > 255:
            return {'error': 'Name is too long'}, 400

        # Validate optional fields
        max_participants = data.get('max_participants', 10)
        if not isinstance(max_participants, int) or max_participants < 1:
            return {'error': 'Invalid max_participants value'}, 400

        universe = Universe(
            name=data['name'],
            creator_id=user_id,
            description=data.get('description'),
            max_participants=max_participants,
            is_public=data.get('is_public', True)
        )
        db.session.add(universe)
        db.session.commit()  # Commit to get the universe ID

        # Create physics parameters
        from ..models.physics_parameters import PhysicsParameters
        physics_params = PhysicsParameters(
            universe_id=universe.id,
            gravity=data.get('physics_parameters', {}).get('gravity', 9.81),
            time_dilation=data.get('physics_parameters', {}).get('time_dilation', 1.0)
        )
        db.session.add(physics_params)
        db.session.commit()

        return jsonify(universe.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 422

@universe_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_universe(id):
    """Get a specific universe"""
    user_id = get_jwt_identity()
    universe = Universe.query.get_or_404(id)

    if not universe.can_access(user_id):
        return {"error": "Access denied"}, 403

    return jsonify(universe.to_dict()), 200

@universe_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_universe(id):
    """Update a universe"""
    universe = Universe.query.get_or_404(id)
    user_id = get_jwt_identity()

    if not universe.can_modify(user_id):
        return {"error": "Access denied"}, 403

    data = request.get_json()

    # Update basic fields
    if 'name' in data:
        universe.name = data['name']
    if 'description' in data:
        universe.description = data['description']
    if 'max_participants' in data:
        universe.max_participants = data['max_participants']
    if 'is_public' in data:
        universe.is_public = bool(data['is_public'])

    # Update parameters if provided
    if 'physics_parameters' in data:
        # Update the physics parameters model
        if not universe.physics_params:
            from ..models.physics_parameters import PhysicsParameters
            universe.physics_params = PhysicsParameters(universe_id=universe.id)

        physics_data = data['physics_parameters']
        if isinstance(physics_data, dict):
            if 'gravity' in physics_data:
                universe.physics_params.gravity = physics_data['gravity']
            if 'time_dilation' in physics_data:
                universe.physics_params.time_dilation = physics_data['time_dilation']

    db.session.commit()
    return jsonify(universe.to_dict()), 200

@universe_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_universe(id):
    """Delete a universe"""
    universe = Universe.query.get_or_404(id)
    user_id = get_jwt_identity()

    if not universe.can_modify(user_id):
        return {"error": "Access denied"}, 403

    # Delete physics parameters first
    if universe.physics_params:
        db.session.delete(universe.physics_params)
        db.session.commit()

    db.session.delete(universe)
    db.session.commit()
    return '', 204

@universe_bp.route('/<int:id>/parameters', methods=['PUT'])
@jwt_required()
def update_parameters(id):
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
