from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Scene, Universe
from ...models.character import Character
from ....extensions import db
import traceback
from datetime import datetime

from . import scenes_bp  # import the Blueprint instance

@scenes_bp.route('/<int:scene_id>', methods=['PUT'])
@jwt_required()
def update_scene(scene_id):
    try:
        current_app.logger.info(f"Updating scene with ID: {scene_id}")

        # Validate scene_id
        if not scene_id or scene_id <= 0:
            current_app.logger.error(f"Invalid scene ID: {scene_id}")
            return jsonify({
                'message': 'Invalid scene ID',
                'error': 'Scene ID must be a positive integer'
            }), 400

        # Parse the JSON request data
        try:
            data = request.get_json()
            if not data:
                current_app.logger.error("No JSON data provided")
                return jsonify({
                    'message': 'No data provided',
                    'error': 'Request must include JSON data'
                }), 400

            current_app.logger.debug(f"Request data: {data}")

        except Exception as json_error:
            current_app.logger.error(f"JSON parsing error: {str(json_error)}")
            return jsonify({
                'message': 'Invalid JSON data',
                'error': str(json_error)
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

            # Check if scene is marked as deleted
            if hasattr(scene, 'is_deleted') and scene.is_deleted:
                current_app.logger.warning(f"Attempted to update deleted scene: {scene_id}")
                return jsonify({
                    'message': 'Scene has been deleted',
                    'error': 'Cannot update a deleted scene'
                }), 404

        except Exception as scene_error:
            current_app.logger.error(f"Error fetching scene {scene_id}: {str(scene_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error retrieving scene',
                'error': str(scene_error)
            }), 500

        # Check permissions
        user_id = get_jwt_identity()
        current_app.logger.info(f"User {user_id} updating scene {scene_id} in universe {scene.universe_id}")

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
            if universe.user_id != user_id:  # For updates, require full ownership
                current_app.logger.warning(f"Access denied: User {user_id} attempting to update scene {scene_id} in universe owned by {universe.user_id}")

                # Special debug log to understand why ownership check is failing
                current_app.logger.error(f"DEBUG - Ownership check: user_id={user_id} (type: {type(user_id)}), universe.user_id={universe.user_id} (type: {type(universe.user_id)})")

                # Try to check if we need to convert types
                if str(universe.user_id) == str(user_id):
                    current_app.logger.info(f"Allowing access: user_id={user_id} string comparison matched universe.user_id={universe.user_id}")
                else:
                    return jsonify({
                        'message': 'Access denied. You must be the owner to update scenes.',
                        'scene': {}
                    }), 403

        except Exception as universe_error:
            current_app.logger.error(f"Error checking universe access for scene {scene_id}: {str(universe_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error checking universe access',
                'error': str(universe_error)
            }), 500

        # Update the scene with the provided data
        try:
            # Update basic fields if provided
            if 'name' in data:
                scene.name = data['name']

            if 'description' in data:
                scene.description = data['description']

            if 'summary' in data:
                scene.summary = data['summary']

            if 'content' in data:
                scene.content = data['content']

            if 'notes_text' in data:
                scene.notes_text = data['notes_text']

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
                if data['date_of_scene']:
                    try:
                        # Handle date parsing based on expected format
                        if isinstance(data['date_of_scene'], str):
                            scene.date_of_scene = data['date_of_scene']
                        else:
                            scene.date_of_scene = str(data['date_of_scene'])
                    except Exception as date_error:
                        current_app.logger.warning(f"Could not parse date_of_scene: {str(date_error)}")
                        # Continue without updating date rather than failing the whole request
                else:
                    scene.date_of_scene = None

            if 'order' in data:
                scene.order = data['order']

            if 'is_public' in data:
                scene.is_public = data['is_public']

            # Update characters if provided
            if 'character_ids' in data:
                try:
                    # Clear existing characters
                    scene.characters = []

                    # Add each character if it exists and belongs to the same universe
                    if data['character_ids']:
                        for char_id in data['character_ids']:
                            character = Character.query.get(char_id)
                            if character and character.universe_id == scene.universe_id:
                                scene.characters.append(character)
                            else:
                                current_app.logger.warning(f"Character {char_id} not found or not in universe {scene.universe_id}")
                except Exception as char_error:
                    current_app.logger.error(f"Error updating characters: {str(char_error)}")
                    current_app.logger.error(traceback.format_exc())
                    # Continue without updating characters rather than failing the whole request

            # Always update the updated_at timestamp
            scene.updated_at = datetime.utcnow()

            # Save changes to database
            db.session.commit()

            current_app.logger.info(f"Scene {scene_id} updated successfully")

            # Build the response with the updated scene data
            scene_dict = {
                'id': scene.id,
                'name': scene.name,
                'universe_id': scene.universe_id,
                'updated_at': str(scene.updated_at)
            }

            # Add optional fields that were set
            if hasattr(scene, 'description') and scene.description is not None:
                scene_dict['description'] = scene.description

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
                scene_dict['date_of_scene'] = scene.date_of_scene

            if hasattr(scene, 'order') and scene.order is not None:
                scene_dict['order'] = scene.order

            if hasattr(scene, 'is_public') and scene.is_public is not None:
                scene_dict['is_public'] = scene.is_public

            # Add character IDs if available
            if hasattr(scene, 'characters') and scene.characters:
                scene_dict['character_ids'] = [c.id for c in scene.characters]

            return jsonify({
                'message': 'Scene updated successfully',
                'scene': scene_dict
            }), 200

        except Exception as update_error:
            db.session.rollback()
            current_app.logger.error(f"Database error updating scene: {str(update_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error updating scene',
                'error': str(update_error)
            }), 500

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Unexpected error updating scene: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error updating scene',
            'error': str(e)
        }), 500
