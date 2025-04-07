from flask import Blueprint, jsonify, request, current_app, url_for, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.api.models.universe import Universe, Scene
from backend.app.api.models.character import Character
from backend.app.api.models.note import Note
from backend.app.extensions import db
from sqlalchemy import text
import traceback

universes_bp = Blueprint('universes', __name__)

@universes_bp.route('/', methods=['GET'])
@jwt_required()
def get_universes():
    try:
        # Get query parameters
        public_only = request.args.get('public', 'false').lower() == 'true'
        user_only = request.args.get('user_only', 'false').lower() == 'true'
        user_id = get_jwt_identity()
        
        current_app.logger.info(f"Fetching universes for user {user_id}, public_only: {public_only}, user_only: {user_only}")

        try:
            # Build query
            query = Universe.query.filter_by(is_deleted=False)
            
            current_app.logger.debug(f"Base query: {str(query)}")

            if user_only:
                # Only include user's own universes when user_only is true
                current_app.logger.debug(f"Filtering by user_id: {user_id}")
                query = query.filter_by(user_id=user_id)
            elif public_only:
                current_app.logger.debug(f"Filtering by public only")
                query = query.filter_by(is_public=True)
            else:
                # Include user's own universes and public universes
                current_app.logger.debug(f"Filtering by user_id: {user_id} OR public=True")
                query = query.filter(
                    (Universe.user_id == user_id) | (Universe.is_public == True)
                )

            # Execute query
            current_app.logger.debug(f"Final query: {str(query)}")
            universes = query.all()
            current_app.logger.info(f"Found {len(universes)} universes")

            # Format response
            universe_dicts = []
            for universe in universes:
                try:
                    universe_dict = universe.to_dict()
                    universe_dicts.append(universe_dict)
                except Exception as e:
                    current_app.logger.error(f"Error converting universe to dict: {str(e)}")
                    current_app.logger.error(f"Universe ID: {universe.id}")
                    # Skip this universe but continue processing
                    continue
            
            current_app.logger.info(f"Successfully formatted {len(universe_dicts)} universes")
            
            return jsonify({
                'message': 'Universes retrieved successfully',
                'universes': universe_dicts
            }), 200
            
        except Exception as inner_e:
            current_app.logger.error(f"Database error retrieving universes: {str(inner_e)}")
            current_app.logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({
                'message': 'Database error retrieving universes',
                'error': str(inner_e)
            }), 500

    except Exception as e:
        current_app.logger.error(f"Error retrieving universes: {str(e)}")
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        current_app.logger.error(f"Query parameters: public_only={request.args.get('public', 'false')}, user_only={request.args.get('user_only', 'false')}")
        
        return jsonify({
            'message': 'Error retrieving universes',
            'error': str(e)
        }), 500

@universes_bp.route('/<int:universe_id>', methods=['GET'])
@jwt_required()
def get_universe(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Check if user has access to this universe
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        return jsonify({
            'message': 'Universe retrieved successfully',
            'universe': universe.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Error retrieving universe',
            'error': str(e)
        }), 500

@universes_bp.route('/', methods=['POST'])
@jwt_required()
def create_universe():
    try:
        data = request.get_json()
        if not data:
            current_app.logger.warning('Create universe attempt with no data')
            return jsonify({
                'message': 'No data provided',
                'error': 'Request body is required'
            }), 400

        user_id = get_jwt_identity()
        current_app.logger.info(f'Creating universe for user {user_id}')
        
        # Validate required fields
        name = data.get('name', '').strip()
        if not name:
            current_app.logger.warning(f'Create universe attempt with empty name by user {user_id}')
            return jsonify({
                'message': 'Name is required',
                'error': 'Universe name cannot be empty'
            }), 400
            
        if len(name) > 100:
            current_app.logger.warning(f'Create universe attempt with too long name by user {user_id}')
            return jsonify({
                'message': 'Name is too long',
                'error': 'Universe name cannot exceed 100 characters'
            }), 400

        # Create new universe with validated data
        universe = Universe(
            name=name,
            description=data.get('description', '').strip(),
            is_public=data.get('is_public', False),
            user_id=user_id
        )

        # Validate the universe object
        try:
            universe.validate()
        except ValueError as ve:
            current_app.logger.warning(f'Universe validation error for user {user_id}: {str(ve)}')
            return jsonify({
                'message': 'Validation error',
                'error': str(ve)
            }), 400

        db.session.add(universe)
        db.session.commit()
        
        current_app.logger.info(f'Universe {universe.id} created successfully for user {user_id}')
        return jsonify({
            'message': 'Universe created successfully',
            'universe': universe.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error creating universe for user {user_id}: {str(e)}')
        return jsonify({
            'message': 'Error creating universe',
            'error': str(e)
        }), 500

@universes_bp.route('/<int:universe_id>', methods=['PUT'])
@jwt_required()
def update_universe(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Check if user owns this universe
        if universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        data = request.get_json()

        # Update universe fields
        if 'name' in data:
            universe.name = data['name']
        if 'description' in data:
            universe.description = data['description']
        if 'is_public' in data:
            universe.is_public = data['is_public']

        db.session.commit()

        return jsonify({
            'message': 'Universe updated successfully',
            'universe': universe.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error updating universe',
            'error': str(e)
        }), 500

@universes_bp.route('/<int:universe_id>', methods=['DELETE'])
@jwt_required()
def delete_universe(universe_id):
    """Soft delete a universe by marking it and all related entities as deleted."""
    try:
        # Get the universe or return 404
        universe = Universe.query.get_or_404(universe_id)
        
        # Check user permission
        user_id = get_jwt_identity()
        if universe.user_id != user_id:
            current_app.logger.warning(f"User {user_id} attempted to delete universe {universe_id} owned by user {universe.user_id}")
            return jsonify({'message': 'Access denied'}), 403
        
        # Log the deletion attempt
        current_app.logger.info(f"Attempting to delete universe {universe_id} by user {user_id}")
        
        # Use a simpler approach: just mark as deleted
        try:
            # Mark the universe as deleted
            current_app.logger.debug(f"Marking universe {universe_id} as deleted")
            universe.is_deleted = True
            db.session.flush()  # Flush to get immediate feedback on any DB issues
            
            # Mark related entities as deleted using direct SQL updates with text()
            # This avoids loading all related objects into memory and potential cascade issues
            current_app.logger.debug(f"Marking scenes for universe {universe_id} as deleted")
            db.session.execute(
                text("UPDATE scenes SET is_deleted = TRUE WHERE universe_id = :universe_id"),
                {"universe_id": universe_id}
            )
            
            current_app.logger.debug(f"Marking characters for universe {universe_id} as deleted")
            db.session.execute(
                text("UPDATE characters SET is_deleted = TRUE WHERE universe_id = :universe_id"),
                {"universe_id": universe_id}
            )
            
            current_app.logger.debug(f"Marking notes for universe {universe_id} as deleted")
            db.session.execute(
                text("UPDATE notes SET is_deleted = TRUE WHERE universe_id = :universe_id"),
                {"universe_id": universe_id}
            )
            
            # Commit all changes
            db.session.commit()
            current_app.logger.info(f"Successfully soft-deleted universe {universe_id} and all related entities")
            
            return jsonify({'message': 'Universe deleted successfully'}), 200
            
        except Exception as db_error:
            db.session.rollback()
            error_message = str(db_error)
            current_app.logger.error(f"Database error while deleting universe {universe_id}: {error_message}")
            current_app.logger.error(traceback.format_exc())
            
            return jsonify({
                'message': 'Error deleting universe', 
                'error': f"Database error: {error_message[:100]}..."
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Unexpected error deleting universe {universe_id}: {str(e)}")
        current_app.logger.error(traceback.format_exc())

        return jsonify({'message': 'Error deleting universe', 'error': str(e)}), 500
@universes_bp.route('/<int:universe_id>/characters', methods=['GET'])
@jwt_required()
def get_universe_characters(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Check if user has access to this universe
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Get all characters for the universe
        characters = Character.query.filter_by(
            universe_id=universe_id,
            is_deleted=False
        ).all()

        return jsonify({
            'message': 'Characters retrieved successfully',
            'characters': [character.to_dict() for character in characters]
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Error retrieving characters',
            'error': str(e)
        }), 500

@universes_bp.route('/<int:universe_id>/scenes', methods=['GET'])
@jwt_required()
def get_universe_scenes(universe_id):
    """
    Get scenes for a universe.
    
    This endpoint redirects to the primary scenes endpoint to maintain a single source of truth.
    For new code, use /api/scenes/universe/<universe_id> instead.
    """
    try:
        current_app.logger.info(f"Redirecting scenes request for universe {universe_id} to the primary scenes endpoint")
        
        # Redirect internally to the scenes endpoint
        from backend.app.api.routes.scenes import get_scenes
        
        # Call the primary endpoint directly
        return get_scenes(universe_id)
        
    except Exception as e:
        current_app.logger.error(f"Error redirecting scenes request for universe {universe_id}: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error retrieving scenes',
            'error': str(e)
        }), 500

@universes_bp.route('/<int:universe_id>/notes', methods=['GET'])
@jwt_required()
def get_universe_notes_route(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Check if user has access to this universe
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Get all notes for the universe
        notes = Note.query.filter_by(
            universe_id=universe_id,
            is_deleted=False
        ).all()

        return jsonify({
            'message': 'Notes retrieved successfully',
            'notes': [note.to_dict() for note in notes]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving notes for universe {universe_id}: {str(e)}")
        return jsonify({
            'message': 'Error retrieving notes',
            'error': str(e)
        }), 500

@universes_bp.route('/<int:universe_id>/repair', methods=['POST'])
@jwt_required()
def repair_universe(universe_id):
    """Special endpoint to repair database issues with a universe."""
    try:
        # Get user ID from token
        user_id = get_jwt_identity()
        
        # Get universe and check ownership
        universe = Universe.query.get_or_404(universe_id)
        
        # Only the owner or admin can repair a universe
        if universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied - only the owner can repair a universe'
            }), 403
        
        # Run the repair method - use class method correctly
        result = Universe.repair_universe(universe_id)
        
        if result['success']:
            # Log success
            current_app.logger.info(f"Universe {universe_id} repaired: {result}")
            return jsonify({
                'message': f"Universe {universe_id} repaired successfully",
                'details': result
            }), 200
        else:
            # Log failure
            current_app.logger.error(f"Failed to repair universe {universe_id}: {result}")
            return jsonify({
                'message': f"Failed to repair universe {universe_id}",
                'error': result['message']
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Error repairing universe {universe_id}: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error repairing universe',
            'error': str(e)
        }), 500 