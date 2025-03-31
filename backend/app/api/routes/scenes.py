from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.models.universe import Scene
from app.api.models.universe import Universe
from app.api.models.character import Character
from app.extensions import db
import traceback

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
        current_app.logger.error(traceback.format_exc())
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
        current_app.logger.error(f"Error retrieving scene: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error retrieving scene',
            'error': str(e)
        }), 500

@scenes_bp.route('/', methods=['GET'])
@jwt_required()
def list_scenes():
    try:
        # Get filter parameters
        universe_id = request.args.get('universe_id')
        user_id = get_jwt_identity()
        
        if universe_id:
            # Get universe and check access
            universe = Universe.query.get_or_404(int(universe_id))
            if not universe.is_public and universe.user_id != user_id:
                return jsonify({
                    'message': 'Access denied'
                }), 403
                
            # Get scenes for the specified universe
            scenes = Scene.query.filter_by(
                universe_id=int(universe_id),
                is_deleted=False
            ).all()
        else:
            # Get all scenes the user has access to
            # This is a simple implementation - in a real app you might want to join with Universe
            scenes = Scene.query.join(Universe).filter(
                ((Universe.user_id == user_id) | (Universe.is_public == True)),
                Scene.is_deleted == False
            ).all()
            
        return jsonify({
            'message': 'Scenes retrieved successfully',
            'scenes': [scene.to_dict() for scene in scenes]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error listing scenes: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error listing scenes',
            'error': str(e)
        }), 500

@scenes_bp.route('/', methods=['POST'])
@jwt_required()
def create_scene():
    try:
        current_app.logger.info(f"Creating scene with request data: {request.data}")
        data = request.get_json()
        if not data:
            current_app.logger.error("No JSON data provided in request")
            return jsonify({
                'message': 'No data provided',
                'error': 'Request body is required'
            }), 400

        current_app.logger.info(f"Scene creation data: {data}")
        user_id = get_jwt_identity()
        current_app.logger.info(f"User ID from JWT: {user_id}")
        
        # Validate required fields
        name = data.get('name', '').strip()
        universe_id = data.get('universe_id')
        
        current_app.logger.info(f"Scene name: {name}, universe_id: {universe_id}")
        
        if not name:
            current_app.logger.error("Scene name is empty")
            return jsonify({
                'message': 'Name is required',
                'error': 'Scene name cannot be empty'
            }), 400
            
        if not universe_id:
            current_app.logger.error("Universe ID is missing")
            return jsonify({
                'message': 'Universe ID is required',
                'error': 'Scene must belong to a universe'
            }), 400

        # Check if universe exists and user has access
        try:
            universe_id = int(universe_id)
            universe = Universe.query.get(universe_id)
            if not universe:
                current_app.logger.error(f"Universe with ID {universe_id} not found")
                return jsonify({
                    'message': 'Universe not found',
                    'error': f'No universe found with ID {universe_id}'
                }), 404
                
            current_app.logger.info(f"Found universe: {universe.name} (ID: {universe.id})")
            
            if not universe.is_public and universe.user_id != user_id:
                current_app.logger.error(f"User {user_id} does not have access to universe {universe_id}")
                return jsonify({
                    'message': 'Access denied'
                }), 403
        except ValueError:
            current_app.logger.error(f"Invalid universe_id format: {universe_id}")
            return jsonify({
                'message': 'Invalid universe ID',
                'error': 'Universe ID must be an integer'
            }), 400

        # Create new scene
        try:
            scene = Scene(
                name=name,
                description=data.get('description', '').strip(),
                universe_id=universe_id
            )
            current_app.logger.info(f"Created scene object: {scene.name} for universe {scene.universe_id}")
        except Exception as e:
            current_app.logger.error(f"Error creating scene object: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error creating scene',
                'error': str(e)
            }), 400

        # Validate the scene
        try:
            scene.validate()
            current_app.logger.info("Scene validation successful")
        except ValueError as ve:
            current_app.logger.error(f"Scene validation error: {str(ve)}")
            return jsonify({
                'message': 'Validation error',
                'error': str(ve)
            }), 400

        try:
            db.session.add(scene)
            current_app.logger.info("Added scene to session")
            db.session.commit()
            current_app.logger.info(f"Committed scene to database with ID: {scene.id}")
            
            return jsonify({
                'message': 'Scene created successfully',
                'scene': scene.to_dict()
            }), 201
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Database error creating scene: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error creating scene',
                'error': str(e)
            }), 500

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Unexpected error creating scene: {str(e)}")
        current_app.logger.error(traceback.format_exc())
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
        current_app.logger.info(f"Updating scene {scene_id} with data: {data}")

        # Update scene fields
        if 'name' in data:
            scene.name = data['name'].strip()
        if 'description' in data:
            scene.description = data['description'].strip()
        if 'summary' in data:
            scene.summary = data['summary']
        if 'content' in data:
            scene.content = data['content']
        if 'notes' in data:
            scene.notes_text = data['notes']
        if 'location' in data:
            scene.location = data['location']
        if 'scene_type' in data:
            scene.scene_type = data['scene_type']
        if 'time_of_day' in data:
            scene.time_of_day = data['time_of_day']
        if 'status' in data:
            scene.status = data['status']
        if 'significance' in data:
            scene.significance = data['significance']
        if 'date_of_scene' in data:
            scene.date_of_scene = data['date_of_scene']
        if 'order' in data:
            scene.order = data['order']
        
        # Update character relationships if provided
        if 'character_ids' in data and isinstance(data['character_ids'], list):
            # Clear existing character associations
            scene.characters = []
            
            # Add new character associations
            for character_id in data['character_ids']:
                character = Character.query.get(character_id)
                if character:
                    scene.characters.append(character)

        # Validate the scene
        try:
            scene.validate()
        except ValueError as ve:
            return jsonify({
                'message': 'Validation error',
                'error': str(ve)
            }), 400

        db.session.commit()
        current_app.logger.info(f"Scene {scene_id} updated successfully")

        return jsonify({
            'message': 'Scene updated successfully',
            'scene': scene.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating scene: {str(e)}")
        current_app.logger.error(traceback.format_exc())
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
        current_app.logger.error(f"Error deleting scene: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error deleting scene',
            'error': str(e)
        }), 500 