from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Scene, Universe
from ....extensions import db
import traceback

from . import scenes_bp  # import the Blueprint instance

@scenes_bp.route('/<int:scene_id>', methods=['GET'])
@jwt_required()
def get_scene(scene_id):
    try:
        current_app.logger.info(f"Fetching scene with ID: {scene_id}")
        
        # Validate scene_id
        if not scene_id or scene_id <= 0:
            current_app.logger.error(f"Invalid scene ID: {scene_id}")
            return jsonify({
                'message': 'Invalid scene ID',
                'error': 'Scene ID must be a positive integer',
                'scene': {}
            }), 400
            
        # Get the scene with additional error handling
        try:
            scene = Scene.query.get(scene_id)
            
            if not scene:
                current_app.logger.warning(f"Scene with ID {scene_id} not found")
                return jsonify({
                    'message': 'Scene not found',
                    'error': f'No scene found with ID {scene_id}',
                    'scene': {}
                }), 404
                
            # Check if scene is marked as deleted
            if hasattr(scene, 'is_deleted') and scene.is_deleted:
                current_app.logger.warning(f"Attempted to access deleted scene: {scene_id}")
                return jsonify({
                    'message': 'Scene has been deleted',
                    'scene': {}
                }), 404
                
        except Exception as scene_error:
            current_app.logger.error(f"Error fetching scene {scene_id}: {str(scene_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error retrieving scene',
                'error': str(scene_error),
                'scene': {}
            }), 500

        # Check permissions
        user_id = get_jwt_identity()
        current_app.logger.info(f"User {user_id} accessing scene {scene_id} from universe {scene.universe_id}")
        
        # Get universe for permission check
        try:
            universe = Universe.query.get(scene.universe_id)
            if not universe:
                current_app.logger.error(f"Universe with ID {scene.universe_id} not found for scene {scene_id}")
                return jsonify({
                    'message': 'Scene universe not found',
                    'error': f'The universe this scene belongs to does not exist',
                    'scene': {}
                }), 404
                
            # Check if user has access to this scene's universe
            if not universe.is_public and universe.user_id != user_id:
                current_app.logger.warning(f"Access denied: User {user_id} attempting to access scene {scene_id} in private universe {scene.universe_id}")
                return jsonify({
                    'message': 'Access denied',
                    'scene': {}
                }), 403
                
        except Exception as universe_error:
            current_app.logger.error(f"Error checking universe access for scene {scene_id}: {str(universe_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error checking universe access',
                'error': str(universe_error),
                'scene': {}
            }), 500

        # Create a comprehensive scene dictionary for the response
        try:
            scene_dict = {
                'id': scene.id,
                'name': scene.name,
                'description': scene.description if hasattr(scene, 'description') else "",
                'universe_id': scene.universe_id,
                'is_deleted': False,  # Explicitly set to False since we already filtered deleted scenes
                'created_at': str(scene.created_at) if hasattr(scene, 'created_at') and scene.created_at else None,
                'updated_at': str(scene.updated_at) if hasattr(scene, 'updated_at') and scene.updated_at else None
            }
            
            # Add optional fields that were set
            if hasattr(scene, 'summary') and scene.summary is not None:
                scene_dict['summary'] = scene.summary
            if hasattr(scene, 'content') and scene.content is not None:
                scene_dict['content'] = scene.content
            if hasattr(scene, 'notes_text') and scene.notes_text is not None:
                scene_dict['notes'] = scene.notes_text
            if hasattr(scene, 'location') and scene.location is not None:
                scene_dict['location'] = scene.location
            if hasattr(scene, 'scene_type') and scene.scene_type is not None:
                scene_dict['scene_type'] = scene.scene_type
            if hasattr(scene, 'time_of_day') and scene.time_of_day is not None:
                scene_dict['time_of_day'] = scene.time_of_day
            if hasattr(scene, 'status') and scene.status is not None:
                scene_dict['status'] = scene.status
            if hasattr(scene, 'significance') and scene.significance is not None:
                scene_dict['significance'] = scene.significance
            if hasattr(scene, 'date_of_scene') and scene.date_of_scene is not None:
                scene_dict['date_of_scene'] = str(scene.date_of_scene)
            if hasattr(scene, 'order') and scene.order is not None:
                scene_dict['order'] = scene.order
            if hasattr(scene, 'is_public') and scene.is_public is not None:
                scene_dict['is_public'] = scene.is_public
                
            # Add character IDs if available
            if hasattr(scene, 'characters') and scene.characters:
                scene_dict['character_ids'] = [c.id for c in scene.characters]
                
            current_app.logger.info(f"Scene {scene_id} retrieved successfully")
            
            return jsonify({
                'message': 'Scene retrieved successfully',
                'scene': scene_dict
            }), 200
            
        except Exception as dict_error:
            current_app.logger.error(f"Error building scene dictionary: {str(dict_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error formatting scene data',
                'error': str(dict_error),
                'scene': {
                    'id': scene.id,
                    'name': scene.name,
                    'universe_id': scene.universe_id
                }
            }), 500

    except Exception as e:
        current_app.logger.error(f"Unexpected error retrieving scene: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error retrieving scene',
            'error': str(e),
            'scene': {}
        }), 500 