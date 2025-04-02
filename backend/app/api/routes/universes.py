from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.models.universe import Universe, Scene
from app.api.models.character import Character
from app.api.models.note import Note
from app import db
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
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Check if user owns this universe
        if universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Get counts for logging
        scenes_count = Scene.query.filter_by(universe_id=universe_id, is_deleted=False).count()
        characters_count = Character.query.filter_by(universe_id=universe_id, is_deleted=False).count()
        notes_count = Note.query.filter_by(universe_id=universe_id, is_deleted=False).count()

        current_app.logger.info(f"Deleting universe {universe_id} with {scenes_count} scenes, {characters_count} characters, {notes_count} notes")

        # Explicitly delete related entities
        try:
            # Delete scenes first
            scenes = Scene.query.filter_by(universe_id=universe_id).all()
            for scene in scenes:
                current_app.logger.debug(f"Deleting scene {scene.id}")
                # Clear character associations
                scene.characters = []
                # Delete scene notes
                Note.query.filter_by(scene_id=scene.id).delete()
                db.session.delete(scene)

            # Delete characters
            Character.query.filter_by(universe_id=universe_id).delete()

            # Delete notes
            Note.query.filter_by(universe_id=universe_id).delete()

            # Delete universe
            db.session.delete(universe)
            db.session.commit()
            
            current_app.logger.info(f"Successfully deleted universe {universe_id} with all related entities")

            return jsonify({
                'message': 'Universe deleted successfully'
            }), 200
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error during cascading delete: {str(e)}")
            current_app.logger.error(f"Traceback: {traceback.format_exc()}")
            raise e

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting universe {universe_id}: {str(e)}")
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'message': 'Error deleting universe',
            'error': str(e)
        }), 500

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
        current_app.logger.error(f"Error retrieving characters for universe {universe_id}: {str(e)}")
        return jsonify({
            'message': 'Error retrieving characters',
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