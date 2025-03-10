from flask import Blueprint, request, jsonify, current_app
from models import Universe, Scene, db
from auth_utils import token_required
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import app

universe_bp = Blueprint('universe', __name__, url_prefix='/api/universes')

# Get all universes for current user
@universe_bp.route('/', methods=['GET'])
@token_required
def get_universes(current_user):
    universes = Universe.query.filter_by(user_id=current_user.id).all()
    return jsonify({
        'universes': [universe.to_dict() for universe in universes]
    })

# Get a specific universe
@universe_bp.route('/<int:universe_id>', methods=['GET'])
@token_required
def get_universe(current_user, universe_id):
    universe = Universe.query.get(universe_id)

    if not universe:
        return jsonify({'message': 'Universe not found'}), 404

    # Check if user owns the universe
    if universe.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized access'}), 403

    return jsonify({
        'universe': universe.to_dict()
    })

# Create a new universe
@universe_bp.route('/', methods=['POST'])
@token_required
def create_universe(current_user):
    data = request.get_json()

    if not data.get('title'):
        return jsonify({'message': 'Title is required'}), 400

    new_universe = Universe(
        title=data.get('title'),
        description=data.get('description'),
        rules=data.get('rules'),
        image_url=data.get('image_url'),
        user_id=current_user.id
    )

    db.session.add(new_universe)
    db.session.commit()

    return jsonify({
        'message': 'Universe created successfully',
        'universe': new_universe.to_dict()
    }), 201

# Update an existing universe
@universe_bp.route('/<int:universe_id>', methods=['PUT'])
@token_required
def update_universe(current_user, universe_id):
    universe = Universe.query.get(universe_id)

    if not universe:
        return jsonify({'message': 'Universe not found'}), 404

    # Check if user owns the universe
    if universe.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized access'}), 403

    data = request.get_json()

    if data.get('title'):
        universe.title = data.get('title')
    if 'description' in data:
        universe.description = data.get('description')
    if 'rules' in data:
        universe.rules = data.get('rules')
    if 'image_url' in data:
        universe.image_url = data.get('image_url')

    db.session.commit()

    return jsonify({
        'message': 'Universe updated successfully',
        'universe': universe.to_dict()
    })

# Delete a universe
@universe_bp.route('/<int:universe_id>', methods=['DELETE'])
@token_required
def delete_universe(current_user, universe_id):
    universe = Universe.query.get(universe_id)

    if not universe:
        return jsonify({'message': 'Universe not found'}), 404

    # Check if user owns the universe
    if universe.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized access'}), 403

    db.session.delete(universe)
    db.session.commit()

    return jsonify({
        'message': 'Universe deleted successfully'
    })

# Get all scenes for a universe
@universe_bp.route('/<int:universe_id>/scenes', methods=['GET'])
@token_required
def get_universe_scenes(current_user, universe_id):
    universe = Universe.query.get(universe_id)

    if not universe:
        return jsonify({'message': 'Universe not found'}), 404

    # Check if user owns the universe
    if universe.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized access'}), 403

    scenes = Scene.query.filter_by(universe_id=universe_id).order_by(Scene.order, Scene.created_at).all()

    return jsonify({
        'scenes': [scene.to_dict() for scene in scenes]
    })
