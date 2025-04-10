from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Scene, Universe
from ....extensions import db
import traceback

from . import scenes_bp  # import the Blueprint instance

@scenes_bp.route('/<int:scene_id>', methods=['DELETE'])
@jwt_required()
def delete_scene(scene_id):
    try:
        current_app.logger.info(f"Deleting scene with ID: {scene_id}")
        
        # Validate scene_id
        if not scene_id or scene_id <= 0:
            current_app.logger.error(f"Invalid scene ID: {scene_id}")
            return jsonify({
                'message': 'Invalid scene ID',
                'error': 'Scene ID must be a positive integer'
            }), 400
            
        # Get the scene with additional error handling
        try:
            scene = Scene.query.get(scene_id)
            
            if not scene:
                current_app.logger.warning(f"Scene with ID {scene_id} not found")
                return jsonify({
                    'message': 'Scene not found',
                    'error': f'No scene found with ID {scene_id}'
                }), 404
                
            # Check if scene is already marked as deleted
            if hasattr(scene, 'is_deleted') and scene.is_deleted:
                current_app.logger.warning(f"Scene {scene_id} is already deleted")
                return jsonify({
                    'message': 'Scene is already deleted',
                    'id': scene_id
                }), 200  # Return 200 as this is not an error condition
                
        except Exception as scene_error:
            current_app.logger.error(f"Error fetching scene {scene_id}: {str(scene_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error retrieving scene',
                'error': str(scene_error)
            }), 500

        # Check permissions
        user_id = get_jwt_identity()
        current_app.logger.info(f"User {user_id} deleting scene {scene_id} in universe {scene.universe_id}")
        
        # Get universe for permission check
        try:
            universe = Universe.query.get(scene.universe_id)
            if not universe:
                current_app.logger.error(f"Universe with ID {scene.universe_id} not found for scene {scene_id}")
                return jsonify({
                    'message': 'Scene universe not found',
                    'error': f'The universe this scene belongs to does not exist'
                }), 404
                
            # Check if user has access to this scene's universe
            if universe.user_id != user_id:  # For deletions, require full ownership
                current_app.logger.warning(f"Access denied: User {user_id} attempting to delete scene {scene_id} in universe owned by {universe.user_id}")
                return jsonify({
                    'message': 'Access denied. You must be the owner to delete scenes.'
                }), 403
                
        except Exception as universe_error:
            current_app.logger.error(f"Error checking universe access for scene {scene_id}: {str(universe_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error checking universe access',
                'error': str(universe_error)
            }), 500

        # Perform the soft delete
        try:
            # Soft delete the scene
            scene.is_deleted = True
            db.session.commit()
            current_app.logger.info(f"Scene {scene_id} soft-deleted successfully")
            
            return jsonify({
                'message': 'Scene deleted successfully',
                'id': scene_id
            }), 200
            
        except Exception as delete_error:
            db.session.rollback()
            current_app.logger.error(f"Database error deleting scene: {str(delete_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error deleting scene',
                'error': str(delete_error)
            }), 500

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Unexpected error deleting scene: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error deleting scene',
            'error': str(e)
        }), 500 