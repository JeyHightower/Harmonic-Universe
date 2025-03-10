from flask import Blueprint, request, jsonify, current_app
from models import Scene, Universe, db
from auth import token_required
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import app

scene_bp = Blueprint('scene', __name__, url_prefix='/api/scenes')

# Get all scenes (with optional filters)
@scene_bp.route('', methods=['GET'])
@token_required
def get_scenes(current_user):
    try:
        # Get query parameters
        user_id = request.args.get('user_id', type=int)
        universe_id = request.args.get('universe_id', type=int)
        title_filter = request.args.get('title', type=str)

        # Start with base query
        query = Scene.query

        # Apply filters if provided
        if user_id:
            query = query.filter_by(user_id=user_id)

        if universe_id:
            query = query.filter_by(universe_id=universe_id)

        if title_filter:
            query = query.filter(Scene.title.ilike(f'%{title_filter}%'))

        # Execute query
        scenes = query.all()

        # Serialize the results
        result = []
        for scene in scenes:
            universe = Universe.query.get(scene.universe_id) if scene.universe_id else None

            scene_data = {
                'id': scene.id,
                'title': scene.title,
                'description': scene.description,
                'content': scene.content,
                'image_url': scene.image_url,
                'universe_id': scene.universe_id,
                'universe_name': universe.name if universe else None,
                'user_id': scene.user_id,
                'creator_name': scene.user.username if scene.user else 'Unknown',
                'created_at': scene.created_at.isoformat() if scene.created_at else None,
                'updated_at': scene.updated_at.isoformat() if scene.updated_at else None
            }
            result.append(scene_data)

        return jsonify(result), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_scenes: {str(e)}")
        return jsonify({'message': 'An error occurred while retrieving scenes'}), 500

# Get a specific scene
@scene_bp.route('/<int:scene_id>', methods=['GET'])
@token_required
def get_scene(current_user, scene_id):
    scene = Scene.query.get(scene_id)

    if not scene:
        return jsonify({'message': 'Scene not found'}), 404

    # Check if user owns the universe that contains the scene
    if scene.universe.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized access'}), 403

    return jsonify({
        'scene': scene.to_dict()
    })

# Create a new scene
@scene_bp.route('/', methods=['POST'])
@token_required
def create_scene(current_user):
    data = request.get_json()

    if not data.get('title'):
        return jsonify({'message': 'Title is required'}), 400

    if not data.get('universe_id'):
        return jsonify({'message': 'Universe ID is required'}), 400

    # Check if universe exists and user owns it
    universe = Universe.query.get(data.get('universe_id'))

    if not universe:
        return jsonify({'message': 'Universe not found'}), 404

    if universe.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized access'}), 403

    # Get the max order for scenes in this universe
    max_order = db.session.query(db.func.max(Scene.order)).filter_by(universe_id=universe.id).scalar() or 0

    new_scene = Scene(
        title=data.get('title'),
        description=data.get('description'),
        content=data.get('content'),
        image_url=data.get('image_url'),
        universe_id=universe.id,
        order=max_order + 1
    )

    db.session.add(new_scene)
    db.session.commit()

    return jsonify({
        'message': 'Scene created successfully',
        'scene': new_scene.to_dict()
    }), 201

# Update an existing scene
@scene_bp.route('/<int:scene_id>', methods=['PUT'])
@token_required
def update_scene(current_user, scene_id):
    scene = Scene.query.get(scene_id)

    if not scene:
        return jsonify({'message': 'Scene not found'}), 404

    # Check if user owns the universe that contains the scene
    if scene.universe.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized access'}), 403

    data = request.get_json()

    if data.get('title'):
        scene.title = data.get('title')
    if 'description' in data:
        scene.description = data.get('description')
    if 'content' in data:
        scene.content = data.get('content')
    if 'image_url' in data:
        scene.image_url = data.get('image_url')
    if 'order' in data:
        scene.order = data.get('order')

    db.session.commit()

    return jsonify({
        'message': 'Scene updated successfully',
        'scene': scene.to_dict()
    })

# Delete a scene
@scene_bp.route('/<int:scene_id>', methods=['DELETE'])
@token_required
def delete_scene(current_user, scene_id):
    scene = Scene.query.get(scene_id)

    if not scene:
        return jsonify({'message': 'Scene not found'}), 404

    # Check if user owns the universe that contains the scene
    if scene.universe.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized access'}), 403

    db.session.delete(scene)
    db.session.commit()

    return jsonify({
        'message': 'Scene deleted successfully'
    })

# Update scene order
@scene_bp.route('/reorder', methods=['PUT'])
@token_required
def reorder_scenes(current_user):
    data = request.get_json()

    if not data.get('scene_orders') or not isinstance(data.get('scene_orders'), list):
        return jsonify({'message': 'Scene orders data is required'}), 400

    # Verify all scenes exist and belong to the user
    scene_ids = [item.get('id') for item in data.get('scene_orders')]
    scenes = Scene.query.filter(Scene.id.in_(scene_ids)).all()

    if len(scenes) != len(scene_ids):
        return jsonify({'message': 'One or more scenes not found'}), 404

    # Check if user owns the universes that contain these scenes
    for scene in scenes:
        if scene.universe.user_id != current_user.id:
            return jsonify({'message': 'Unauthorized access'}), 403

    # Update orders
    for item in data.get('scene_orders'):
        scene = next((s for s in scenes if s.id == item.get('id')), None)
        if scene:
            scene.order = item.get('order')

    db.session.commit()

    return jsonify({
        'message': 'Scene order updated successfully'
    })
