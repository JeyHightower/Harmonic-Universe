# Universe routes

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.app import db
from app.models.universe.universe import Universe
from app.models.user.user import User

universe_routes = Blueprint('universe_routes', __name__)

@universe_routes.route('', methods=['GET'])
def get_all_universes():
    """Get all public universes or all universes owned by the current user"""
    user_id = get_jwt_identity() if request.args.get('include_user') == 'true' else None
    
    if user_id:
        # Get public universes and user's universes
        universes = Universe.query.filter(
            (Universe.is_public == True) | (Universe.creator_id == user_id)
        ).all()
    else:
        # Get only public universes
        universes = Universe.query.filter_by(is_public=True).all()
    
    return jsonify({
        'universes': [universe.to_dict() for universe in universes]
    }), 200

@universe_routes.route('/<int:universe_id>', methods=['GET'])
def get_universe(universe_id):
    """Get a specific universe by ID"""
    universe = Universe.query.get(universe_id)
    
    if not universe:
        return jsonify({'error': 'Universe not found'}), 404
    
    # Check if detailed view is requested
    if request.args.get('detailed') == 'true':
        return jsonify(universe.to_dict_with_scenes()), 200
    else:
        return jsonify(universe.to_dict()), 200

@universe_routes.route('', methods=['POST'])
@jwt_required()
def create_universe():
    """Create a new universe"""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    # Get the current user ID from JWT
    current_user_id = get_jwt_identity()
    
    # Create new universe
    new_universe = Universe(
        name=data.get('name'),
        description=data.get('description', ''),
        creator_id=current_user_id,
        is_public=data.get('is_public', False),
        thumbnail_url=data.get('thumbnail_url', ''),
        physics_rules=data.get('physics_rules', '')
    )
    
    # Add to database
    db.session.add(new_universe)
    db.session.commit()
    
    return jsonify(new_universe.to_dict()), 201

@universe_routes.route('/<int:universe_id>', methods=['PUT'])
@jwt_required()
def update_universe(universe_id):
    """Update an existing universe"""
    universe = Universe.query.get(universe_id)
    
    if not universe:
        return jsonify({'error': 'Universe not found'}), 404
    
    # Check ownership
    current_user_id = get_jwt_identity()
    if universe.creator_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get data from request
    data = request.get_json()
    
    # Update universe attributes
    if 'name' in data:
        universe.name = data['name']
    if 'description' in data:
        universe.description = data['description']
    if 'is_public' in data:
        universe.is_public = data['is_public']
    if 'thumbnail_url' in data:
        universe.thumbnail_url = data['thumbnail_url']
    if 'physics_rules' in data:
        universe.physics_rules = data['physics_rules']
    
    # Save changes
    db.session.commit()
    
    return jsonify(universe.to_dict()), 200

@universe_routes.route('/<int:universe_id>', methods=['DELETE'])
@jwt_required()
def delete_universe(universe_id):
    """Delete a universe"""
    universe = Universe.query.get(universe_id)
    
    if not universe:
        return jsonify({'error': 'Universe not found'}), 404
    
    # Check ownership
    current_user_id = get_jwt_identity()
    if universe.creator_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Delete the universe (cascade will handle related entities)
    db.session.delete(universe)
    db.session.commit()
    
    return jsonify({'message': 'Universe deleted successfully'}), 200