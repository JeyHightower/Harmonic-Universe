from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.api.models.universe import Scene, Universe
from backend.app.api.models.character import Character
from backend.app.extensions import db
import traceback
from sqlalchemy import text, create_engine

scenes_bp = Blueprint('scenes', __name__)

@scenes_bp.route('/universe/<int:universe_id>', methods=['GET'])
@jwt_required()
def get_scenes(universe_id):
    try:
        current_app.logger.info(f"Fetching scenes for universe ID: {universe_id}")
        
        # Check if universe_id is valid
        if not universe_id or universe_id <= 0:
            current_app.logger.error(f"Invalid universe ID: {universe_id}")
            return jsonify({
                'message': 'Invalid universe ID',
                'error': 'Universe ID must be a positive integer'
            }), 400
        
        # Get universe with additional error handling
        try:
            universe = Universe.query.get(universe_id)
            
            if not universe:
                current_app.logger.warning(f"Universe with ID {universe_id} not found")
                return jsonify({
                    'message': 'Universe not found',
                    'error': f'No universe found with ID {universe_id}'
                }), 404
                
            if hasattr(universe, 'is_deleted') and universe.is_deleted:
                current_app.logger.warning(f"Attempted to access deleted universe: {universe_id}")
                return jsonify({
                    'message': 'Universe has been deleted'
                }), 404
        except Exception as universe_error:
            current_app.logger.error(f"Error fetching universe {universe_id}: {str(universe_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error retrieving universe',
                'error': str(universe_error)
            }), 500

        # Check permissions
        user_id = get_jwt_identity()
        current_app.logger.info(f"User {user_id} accessing universe {universe_id} (owner: {universe.user_id})")
        
        if not universe.is_public and universe.user_id != user_id:
            current_app.logger.warning(f"Access denied: User {user_id} attempting to access private universe {universe_id}")
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Get all scenes for the universe with clean session management
        try:
            # Ensure we're using a fresh session
            db.session.expire_all()
            
            # Get scenes with basic query to avoid complex serialization issues
            scenes = Scene.query.filter_by(
                universe_id=universe_id,
                is_deleted=False
            ).all()
            
            current_app.logger.info(f"Found {len(scenes) if scenes else 0} scenes for universe {universe_id}")
            
            # Safely convert scenes to dictionaries with error handling
            scene_list = []
            for scene in scenes:
                try:
                    # Use a simplified dictionary to avoid serialization issues
                    scene_dict = {
                        'id': scene.id,
                        'name': str(scene.name) if hasattr(scene, 'name') and scene.name is not None else "Unknown",
                        'universe_id': scene.universe_id,
                        'is_public': bool(scene.is_public) if hasattr(scene, 'is_public') else False,
                        'is_deleted': bool(scene.is_deleted) if hasattr(scene, 'is_deleted') else False
                    }
                    
                    # Add optional fields that might cause problems
                    if hasattr(scene, 'description') and scene.description is not None:
                        scene_dict['description'] = str(scene.description)
                    
                    if hasattr(scene, 'created_at') and scene.created_at is not None:
                        scene_dict['created_at'] = str(scene.created_at)
                    
                    if hasattr(scene, 'updated_at') and scene.updated_at is not None:
                        scene_dict['updated_at'] = str(scene.updated_at)
                    
                    scene_list.append(scene_dict)
                except Exception as scene_error:
                    current_app.logger.error(f"Error converting scene {scene.id} to dict: {str(scene_error)}")
                    # Add minimal data if conversion fails
                    scene_list.append({
                        'id': scene.id,
                        'name': 'Error: Could not load scene data',
                        'universe_id': universe_id,
                        'error': str(scene_error)
                    })
            
            return jsonify({
                'message': 'Scenes retrieved successfully',
                'scenes': scene_list
            }), 200
            
        except Exception as query_error:
            current_app.logger.error(f"Database error querying scenes: {str(query_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Database error retrieving scenes',
                'error': str(query_error)
            }), 500

    except Exception as e:
        current_app.logger.error(f"Unexpected error retrieving scenes: {str(e)}")
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
    """List scenes with filtering by universe ID"""
    try:
        # Get filter parameters
        universe_id = request.args.get('universe_id')
        user_id = get_jwt_identity()
        
        current_app.logger.info(f"Listing scenes with params: universe_id={universe_id}, user_id={user_id}")
        
        if universe_id:
            try:
                # Safely convert universe_id to int
                universe_id_int = int(universe_id)
                current_app.logger.debug(f"Looking up universe with ID: {universe_id_int}")
                
                # Get universe and check access
                universe = Universe.query.get(universe_id_int)
                
                if not universe:
                    current_app.logger.warning(f"Universe with ID {universe_id_int} not found")
                    return jsonify({
                        'message': 'Universe not found',
                        'error': f'No universe found with ID {universe_id_int}',
                        'scenes': []  # Return empty array instead of error
                    }), 404
                
                # Check if universe is deleted - use explicit comparison with is_deleted field
                if hasattr(universe, 'is_deleted') and universe.is_deleted is True:
                    current_app.logger.warning(f"Universe with ID {universe_id_int} has been deleted")
                    return jsonify({
                        'message': 'Universe has been deleted',
                        'scenes': []
                    }), 404
                
                current_app.logger.debug(f"Found universe: {universe.name} (owner: {universe.user_id})")
                
                # Check access permissions - use explicit comparison 
                if hasattr(universe, 'is_public') and universe.is_public is not True and universe.user_id != user_id:
                    current_app.logger.warning(f"Access denied: User {user_id} attempting to access universe {universe_id_int} owned by {universe.user_id}")
                    return jsonify({
                        'message': 'Access denied',
                        'scenes': []  # Return empty array instead of error
                    }), 403
                
                # Get scenes for the specified universe - use a try/except block for the query itself
                try:
                    # Use a new session to avoid any transaction issues from previous operations
                    db.session.close()  # Close any existing session
                    db.session.remove()  # Remove it from the registry
                    
                    # Extra protection - use a raw query first to see if we get data at all
                    try:
                        # First check if there are any scenes using a simple count query
                        # Use a new connection for a clean transaction state
                        engine = db.engine
                        with engine.connect() as connection:
                            # Explicitly start a new transaction
                            with connection.begin():
                                raw_count = connection.execute(
                                    text("SELECT COUNT(*) FROM scenes WHERE universe_id = :universe_id AND is_deleted = false"),
                                    {"universe_id": universe_id_int}
                                ).scalar()
                                
                                current_app.logger.info(f"Raw count query found {raw_count} scenes for universe {universe_id_int}")
                                
                                # If there are no scenes, return early with an empty array
                                if raw_count == 0:
                                    return jsonify({
                                        'message': 'No scenes found for this universe',
                                        'scenes': []
                                    }), 200
                    except Exception as raw_error:
                        current_app.logger.error(f"Raw count query error: {str(raw_error)}")
                        # Continue with the ORM approach even if the raw query fails
                    
                    # Create a fresh session for the ORM query
                    with db.session.begin():
                        # Direct serialization instead of using the complex to_dict method
                        scenes = Scene.query.filter_by(
                            universe_id=universe_id_int,
                            is_deleted=False
                        ).all()
                        
                        if scenes is None:
                            scenes = []  # Ensure scenes is always a list
                        
                        current_app.logger.info(f"Found {len(scenes)} scenes for universe {universe_id_int}")
                        
                        # Safely convert scenes to dictionaries with individual error handling per scene
                        scene_dicts = []
                        for scene in scenes:
                            try:
                                # Create a basic dictionary with only essential fields to avoid serialization issues
                                basic_dict = {
                                    'id': scene.id,
                                    'name': str(scene.name) if hasattr(scene, 'name') and scene.name is not None else "Unknown",
                                    'universe_id': scene.universe_id
                                }
                                
                                # Try to add additional fields safely
                                try:
                                    if hasattr(scene, 'description'):
                                        basic_dict['description'] = str(scene.description) if scene.description else ""
                                except Exception:
                                    pass  # Skip fields that cause errors
                                    
                                try:
                                    if hasattr(scene, 'is_public'):
                                        basic_dict['is_public'] = bool(scene.is_public)
                                except Exception:
                                    pass
                                    
                                try:
                                    if hasattr(scene, 'is_deleted'):
                                        basic_dict['is_deleted'] = bool(scene.is_deleted)
                                except Exception:
                                    pass
                                    
                                # Add it to our results
                                scene_dicts.append(basic_dict)
                                
                            except Exception as scene_error:
                                current_app.logger.error(f"Error converting scene {scene.id} to dict: {str(scene_error)}")
                                current_app.logger.error(traceback.format_exc())
                                
                                # Add minimal information for this scene
                                try:
                                    scene_dicts.append({
                                        'id': scene.id,
                                        'name': "Unknown scene",
                                        'universe_id': scene.universe_id,
                                        'error': 'Error generating complete scene data'
                                    })
                                except:
                                    # If even minimal data fails, just continue
                                    current_app.logger.error(f"Could not add even minimal scene data")
                    
                    return jsonify({
                        'message': 'Scenes retrieved successfully',
                        'scenes': scene_dicts
                    }), 200
                    
                except Exception as query_error:
                    # Make sure to roll back any transaction in case of error
                    db.session.rollback()
                    current_app.logger.error(f"Database error querying scenes: {str(query_error)}")
                    current_app.logger.error(traceback.format_exc())
                    return jsonify({
                        'message': 'Database error retrieving scenes',
                        'error': str(query_error),
                        'scenes': []  # Return empty array instead of error
                    }), 200  # Return 200 even on error to prevent frontend issues
            except ValueError:
                current_app.logger.error(f"Invalid universe_id format: {universe_id}")
                return jsonify({
                    'message': 'Invalid universe ID',
                    'error': 'Universe ID must be an integer',
                    'scenes': []  # Return empty array instead of error
                }), 400
        else:
            # Get all scenes the user has access to (simplify this query to avoid errors)
            try:
                # Use simpler query to avoid complex joins
                # Use filter_by instead of filter for simple equality conditions
                public_scenes = Scene.query.join(
                    Universe, Scene.universe_id == Universe.id
                ).filter(
                    Universe.is_public == True,  # This works correctly in practice despite the linter warning
                ).filter_by(
                    is_deleted=False
                ).all()
                
                user_scenes = Scene.query.join(
                    Universe, Scene.universe_id == Universe.id
                ).filter(
                    Universe.user_id == user_id,  
                ).filter_by(
                    is_deleted=False
                ).all()
                
                # Ensure we have valid lists
                if public_scenes is None:
                    public_scenes = []
                if user_scenes is None:
                    user_scenes = []
                
                # Combine both sets of scenes (removing duplicates)
                scene_ids = set()
                scenes = []
                
                for scene in public_scenes:
                    if scene.id not in scene_ids:
                        scene_ids.add(scene.id)
                        scenes.append(scene)
                
                for scene in user_scenes:
                    if scene.id not in scene_ids:
                        scene_ids.add(scene.id)
                        scenes.append(scene)
                
                current_app.logger.info(f"Found {len(scenes)} scenes across all accessible universes")
                
                # Safely convert scenes to dictionaries with individual error handling per scene
                scene_dicts = []
                for scene in scenes:
                    try:
                        # Directly serialize instead of using to_dict() which has complex logic
                        scene_dict = {
                            'id': scene.id,
                            'name': str(scene.name) if hasattr(scene, 'name') and scene.name is not None else "Unknown",
                            'universe_id': scene.universe_id,
                            'description': scene.description if hasattr(scene, 'description') else "",
                            'created_at': scene.created_at.isoformat() if hasattr(scene, 'created_at') and scene.created_at else None,
                            'updated_at': scene.updated_at.isoformat() if hasattr(scene, 'updated_at') and scene.updated_at else None,
                            'is_deleted': bool(scene.is_deleted) if hasattr(scene, 'is_deleted') else False,
                            'is_public': bool(scene.is_public) if hasattr(scene, 'is_public') else False,
                        }
                        scene_dicts.append(scene_dict)
                    except Exception as scene_error:
                        current_app.logger.error(f"Error converting scene {scene.id} to dict: {str(scene_error)}")
                        current_app.logger.error(traceback.format_exc())
                        
                        # Add minimal information for this scene
                        try:
                            scene_dicts.append({
                                'id': scene.id,
                                'name': str(scene.name) if hasattr(scene, 'name') and scene.name is not None else "Unknown",
                                'universe_id': scene.universe_id,
                                'error': 'Error generating complete scene data'
                            })
                        except:
                            # If even minimal data fails, just continue
                            current_app.logger.error(f"Could not add even minimal scene data")
                
                return jsonify({
                    'message': 'Scenes retrieved successfully',
                    'scenes': scene_dicts
                }), 200
                
            except Exception as query_error:
                current_app.logger.error(f"Database error querying all scenes: {str(query_error)}")
                current_app.logger.error(traceback.format_exc())
                return jsonify({
                    'message': 'Database error retrieving scenes',
                    'error': str(query_error),
                    'scenes': []  # Return empty array instead of error
                }), 500
        
    except Exception as e:
        current_app.logger.error(f"Error listing scenes: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error listing scenes',
            'error': str(e),
            'scenes': []  # Return empty array instead of error
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
                'error': 'Request body is required',
                'scene': {}  # Include empty scene to prevent UI breakage
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
                'error': 'Scene name cannot be empty',
                'scene': {}
            }), 400
            
        if not universe_id:
            current_app.logger.error("Universe ID is missing")
            return jsonify({
                'message': 'Universe ID is required',
                'error': 'Scene must belong to a universe',
                'scene': {}
            }), 400

        # Check if universe exists and user has access
        try:
            universe_id = int(universe_id)
            universe = Universe.query.get(universe_id)
            if not universe:
                current_app.logger.error(f"Universe with ID {universe_id} not found")
                return jsonify({
                    'message': 'Universe not found',
                    'error': f'No universe found with ID {universe_id}',
                    'scene': {}
                }), 404
                
            current_app.logger.info(f"Found universe: {universe.name} (ID: {universe.id})")
            
            if not universe.is_public and universe.user_id != user_id:
                current_app.logger.error(f"User {user_id} does not have access to universe {universe_id}")
                return jsonify({
                    'message': 'Access denied',
                    'scene': {}
                }), 403
        except ValueError:
            current_app.logger.error(f"Invalid universe_id format: {universe_id}")
            return jsonify({
                'message': 'Invalid universe ID',
                'error': 'Universe ID must be an integer',
                'scene': {}
            }), 400

        # Create new scene
        try:
            scene = Scene(
                name=name,
                description=data.get('description', '').strip(),
                universe_id=universe_id
            )
            # Explicitly set is_deleted to False
            scene.is_deleted = False
            
            # Set optional fields from request data
            if 'summary' in data:
                scene.summary = data.get('summary')
            if 'content' in data:
                scene.content = data.get('content')
            if 'notes' in data:
                scene.notes_text = data.get('notes')
            if 'location' in data:
                scene.location = data.get('location')
            if 'scene_type' in data:
                scene.scene_type = data.get('scene_type')
            if 'time_of_day' in data:
                scene.time_of_day = data.get('time_of_day')
            if 'status' in data:
                scene.status = data.get('status')
            if 'significance' in data:
                scene.significance = data.get('significance')
            if 'date_of_scene' in data:
                scene.date_of_scene = data.get('date_of_scene')
            if 'order' in data:
                scene.order = data.get('order')
            if 'is_public' in data:
                scene.is_public = data.get('is_public')
                
            current_app.logger.info(f"Created scene object: {scene.name} for universe {scene.universe_id}")
        except Exception as e:
            current_app.logger.error(f"Error creating scene object: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error creating scene',
                'error': str(e),
                'scene': {}
            }), 400

        # Validate the scene
        try:
            scene.validate()
            current_app.logger.info("Scene validation successful")
        except ValueError as ve:
            current_app.logger.error(f"Scene validation error: {str(ve)}")
            return jsonify({
                'message': 'Validation error',
                'error': str(ve),
                'scene': {}
            }), 400

        try:
            db.session.add(scene)
            current_app.logger.info("Added scene to session")
            db.session.commit()
            current_app.logger.info(f"Committed scene to database with ID: {scene.id}")
            
            # Create a comprehensive scene dictionary for the response
            scene_dict = {
                'id': scene.id,
                'name': scene.name,
                'description': scene.description,
                'universe_id': scene.universe_id,
                'is_deleted': False,  # Explicitly set to False
                'created_at': str(scene.created_at) if scene.created_at else None,
                'updated_at': str(scene.updated_at) if scene.updated_at else None
            }
            
            # Add optional fields that were set
            if scene.summary is not None:
                scene_dict['summary'] = scene.summary
            if scene.content is not None:
                scene_dict['content'] = scene.content
            if scene.notes_text is not None:
                scene_dict['notes'] = scene.notes_text
            if scene.location is not None:
                scene_dict['location'] = scene.location
            if scene.scene_type is not None:
                scene_dict['scene_type'] = scene.scene_type
            if scene.time_of_day is not None:
                scene_dict['time_of_day'] = scene.time_of_day
            if scene.status is not None:
                scene_dict['status'] = scene.status
            if scene.significance is not None:
                scene_dict['significance'] = scene.significance
            if scene.date_of_scene is not None:
                scene_dict['date_of_scene'] = scene.date_of_scene
            if scene.order is not None:
                scene_dict['order'] = scene.order
            if scene.is_public is not None:
                scene_dict['is_public'] = scene.is_public
            
            return jsonify({
                'message': 'Scene created successfully',
                'scene': scene_dict
            }), 201
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Database error creating scene: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error creating scene',
                'error': str(e),
                'scene': {}
            }), 500  # Use 500 for server errors

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Unexpected error creating scene: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error creating scene',
            'error': str(e),
            'scene': {}
        }), 500  # Use 500 for server errors

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