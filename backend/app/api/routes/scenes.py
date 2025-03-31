from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.models.universe import Scene
from app.api.models.universe import Universe
from app.api.models.character import Character
from app.extensions import db

scenes_bp = Blueprint('scenes', __name__)

@scenes_bp.route('/universe/<int:universe_id>', methods=['GET'])
@jwt_required()
def get_scenes(universe_id):
    try:
        # Get universe and check access
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Get all scenes for the universe
        scenes = Scene.query.filter_by(
            universe_id=universe_id,
            is_deleted=False
        ).all()

        return jsonify({
            'message': 'Scenes retrieved successfully',
            'scenes': [scene.to_dict() for scene in scenes]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving scenes: {str(e)}")
        return jsonify({
            'message': 'Error retrieving scenes',
            'error': str(e)
        }), 500

@scenes_bp.route('/<int:scene_id>', methods=['GET'])
@jwt_required()
def get_scene(scene_id):
    try:
        scene = Scene.query.get_or_404(scene_id)
        user_id = get_jwt_identity()

        # Check if user has access to this scene's universe
        if not scene.universe.is_public and scene.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        return jsonify({
            'message': 'Scene retrieved successfully',
            'scene': scene.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Error retrieving scene',
            'error': str(e)
        }), 500

@scenes_bp.route('/', methods=['POST'])
@jwt_required()
def create_scene():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'message': 'No data provided',
                'error': 'Request body is required'
            }), 400

        user_id = get_jwt_identity()
        
        # Validate required fields
        name = data.get('name', '').strip()
        universe_id = data.get('universe_id')
        
        if not name:
            return jsonify({
                'message': 'Name is required',
                'error': 'Scene name cannot be empty'
            }), 400
            
        if not universe_id:
            return jsonify({
                'message': 'Universe ID is required',
                'error': 'Scene must belong to a universe'
            }), 400

        # Check if universe exists and user has access
        universe = Universe.query.get_or_404(universe_id)
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Create new scene
        scene = Scene(
            name=name,
            description=data.get('description', '').strip(),
            universe_id=universe_id
        )

        # Validate the scene
        try:
            scene.validate()
        except ValueError as ve:
            return jsonify({
                'message': 'Validation error',
                'error': str(ve)
            }), 400

        db.session.add(scene)
        db.session.commit()
        
        return jsonify({
            'message': 'Scene created successfully',
            'scene': scene.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error creating scene',
            'error': str(e)
        }), 500

@scenes_bp.route('/<int:scene_id>', methods=['PUT'])
@jwt_required()
def update_scene(scene_id):
    try:
        scene = Scene.query.get_or_404(scene_id)
        user_id = get_jwt_identity()

        # Check if user has access to this scene's universe
        if not scene.universe.is_public and scene.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        data = request.get_json()

        # Update scene fields
        if 'name' in data:
            scene.name = data['name'].strip()
        if 'description' in data:
            scene.description = data['description'].strip()

        # Validate the scene
        try:
            scene.validate()
        except ValueError as ve:
            return jsonify({
                'message': 'Validation error',
                'error': str(ve)
            }), 400

        db.session.commit()

        return jsonify({
            'message': 'Scene updated successfully',
            'scene': scene.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error updating scene',
            'error': str(e)
        }), 500

@scenes_bp.route('/<int:scene_id>', methods=['DELETE'])
@jwt_required()
def delete_scene(scene_id):
    try:
        scene = Scene.query.get_or_404(scene_id)
        user_id = get_jwt_identity()

        # Check if user has access to this scene's universe
        if not scene.universe.is_public and scene.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Soft delete the scene
        scene.is_deleted = True
        db.session.commit()

        return jsonify({
            'message': 'Scene deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error deleting scene',
            'error': str(e)
        }), 500 