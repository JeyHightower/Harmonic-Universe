from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Scene, Universe
from ...models.character import Character
from ....extensions import db
import traceback
from datetime import datetime

from . import scenes_bp  # import the Blueprint instance

@scenes_bp.route('/', methods=['POST'])
@jwt_required()
def create_scene():
    try:
        current_app.logger.info("Creating new scene")
        
        # Get user ID from JWT
        user_id = get_jwt_identity()
        current_app.logger.info(f"User {user_id} creating scene")
        
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
        
        # Validate required fields
        if 'universe_id' not in data:
            current_app.logger.error("Missing universe_id in request")
            return jsonify({
                'message': 'Missing required field',
                'error': 'universe_id is required'
            }), 400
            
        if 'name' not in data:
            current_app.logger.error("Missing name in request")
            return jsonify({
                'message': 'Missing required field',
                'error': 'name is required'
            }), 400
        
        # Validate universe exists and user has permission to add scenes
        try:
            universe_id = data['universe_id']
            universe = Universe.query.get(universe_id)
            
            if not universe:
                current_app.logger.warning(f"Universe with ID {universe_id} not found")
                return jsonify({
                    'message': 'Universe not found',
                    'error': f'No universe found with ID {universe_id}'
                }), 404
            
            # Check user permission (must be owner to create scenes)
            if universe.user_id != user_id:
                current_app.logger.warning(f"Access denied: User {user_id} attempting to create scene in universe owned by {universe.user_id}")
                return jsonify({
                    'message': 'Access denied',
                    'error': 'You must be the universe owner to create scenes'
                }), 403
                
        except Exception as universe_error:
            current_app.logger.error(f"Error checking universe permissions: {str(universe_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error validating universe access',
                'error': str(universe_error)
            }), 500
        
        # Create the new scene
        try:
            # Create a new Scene object with the provided data
            new_scene = Scene(
                name=data['name'],
                universe_id=data['universe_id'],
                user_id=user_id,  # Associate with the current user
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                is_deleted=False
            )
            
            # Add optional fields if provided
            if 'description' in data:
                new_scene.description = data['description']
                
            if 'summary' in data:
                new_scene.summary = data['summary']
                
            if 'content' in data:
                new_scene.content = data['content']
                
            if 'notes_text' in data:
                new_scene.notes_text = data['notes_text']
                
            if 'location' in data:
                new_scene.location = data['location']
                
            if 'scene_type' in data:
                new_scene.scene_type = data['scene_type']
                
            if 'time_of_day' in data:
                new_scene.time_of_day = data['time_of_day']
                
            if 'status' in data:
                new_scene.status = data['status']
                
            if 'significance' in data:
                new_scene.significance = data['significance']
                
            if 'date_of_scene' in data and data['date_of_scene']:
                try:
                    # Handle date parsing based on expected format
                    if isinstance(data['date_of_scene'], str):
                        new_scene.date_of_scene = datetime.fromisoformat(data['date_of_scene'].replace('Z', '+00:00'))
                    else:
                        new_scene.date_of_scene = data['date_of_scene']
                except Exception as date_error:
                    current_app.logger.warning(f"Could not parse date_of_scene: {str(date_error)}")
                    # Continue without the date rather than rejecting the whole request
            
            if 'order' in data:
                new_scene.order = data['order']
                
            if 'is_public' in data:
                new_scene.is_public = data['is_public']
            else:
                # Default to the universe's public setting
                new_scene.is_public = universe.is_public
                
            # Add characters if provided
            if 'character_ids' in data and data['character_ids']:
                try:
                    # Validate and add each character
                    for char_id in data['character_ids']:
                        character = Character.query.get(char_id)
                        if character and character.universe_id == universe_id:
                            new_scene.characters.append(character)
                        else:
                            current_app.logger.warning(f"Character {char_id} not found or not in universe {universe_id}")
                except Exception as char_error:
                    current_app.logger.error(f"Error adding characters: {str(char_error)}")
                    # Continue without characters rather than rejecting the whole request
            
            # Save to database
            db.session.add(new_scene)
            db.session.commit()
            
            current_app.logger.info(f"Scene created successfully with ID {new_scene.id}")
            
            # Return the created scene data
            response_data = {
                'id': new_scene.id,
                'name': new_scene.name,
                'universe_id': new_scene.universe_id,
                'created_at': str(new_scene.created_at),
                'updated_at': str(new_scene.updated_at)
            }
            
            # Add other fields that were set
            if hasattr(new_scene, 'description') and new_scene.description:
                response_data['description'] = new_scene.description
                
            if hasattr(new_scene, 'is_public'):
                response_data['is_public'] = new_scene.is_public
                
            # Add character IDs if available
            if hasattr(new_scene, 'characters') and new_scene.characters:
                response_data['character_ids'] = [c.id for c in new_scene.characters]
                
            return jsonify({
                'message': 'Scene created successfully',
                'scene': response_data
            }), 201
            
        except Exception as create_error:
            db.session.rollback()
            current_app.logger.error(f"Error creating scene: {str(create_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error creating scene',
                'error': str(create_error)
            }), 500
            
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Unexpected error creating scene: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error creating scene',
            'error': str(e)
        }), 500 