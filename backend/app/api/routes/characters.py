from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.api.models.universe import Scene
from backend.app.api.models.character import Character
from backend.app.extensions import db

characters_bp = Blueprint('characters', __name__)

@characters_bp.route('/scene/<int:scene_id>', methods=['GET'])
@jwt_required()
def get_characters(scene_id):
    try:
        # Get scene and check access
        scene = Scene.query.get_or_404(scene_id)
        user_id = get_jwt_identity()

        if not scene.universe.is_public and scene.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Get all characters for the scene through the many-to-many relationship
        # using the scene.characters relationship
        characters = scene.characters
        
        # Filter out deleted characters
        active_characters = [c for c in characters if not c.is_deleted]

        return jsonify({
            'message': 'Characters retrieved successfully',
            'characters': [character.to_dict() for character in active_characters]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving characters: {str(e)}")
        return jsonify({
            'message': 'Error retrieving characters',
            'error': str(e)
        }), 500

@characters_bp.route('/<int:character_id>', methods=['GET'])
@jwt_required()
def get_character(character_id):
    try:
        character = Character.query.get_or_404(character_id)
        user_id = get_jwt_identity()

        # Get the universe for this character
        universe_id = character.universe_id
        
        # Check if the universe is public or belongs to the user
        from backend.app.api.models.universe import Universe
        universe = Universe.query.get_or_404(universe_id)
        
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        return jsonify({
            'message': 'Character retrieved successfully',
            'character': character.to_dict()
        }), 200

    except Exception as e:
        print(f"Error retrieving character: {str(e)}")
        return jsonify({
            'message': 'Error retrieving character',
            'error': str(e)
        }), 500

@characters_bp.route('', methods=['POST'])
@jwt_required()
def create_character():
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
        scene_id = data.get('scene_id')
        
        if not name:
            return jsonify({
                'message': 'Name is required',
                'error': 'Character name cannot be empty'
            }), 400
            
        if not scene_id:
            return jsonify({
                'message': 'Scene ID is required',
                'error': 'Character must belong to a scene'
            }), 400

        # Check if scene exists and user has access
        scene = Scene.query.get_or_404(scene_id)
        if not scene.universe.is_public and scene.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Create new character
        character = Character(
            name=name,
            universe_id=scene.universe_id,
            description=data.get('description', '').strip()
        )
        
        # Add relationship to scene
        character.scenes.append(scene)

        # Validate the character
        try:
            character.validate()
        except ValueError as ve:
            return jsonify({
                'message': 'Validation error',
                'error': str(ve)
            }), 400

        db.session.add(character)
        db.session.commit()
        
        return jsonify({
            'message': 'Character created successfully',
            'character': character.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error creating character',
            'error': str(e)
        }), 500

@characters_bp.route('/<int:character_id>', methods=['PUT'])
@jwt_required()
def update_character(character_id):
    try:
        character = Character.query.get_or_404(character_id)
        user_id = get_jwt_identity()

        # Get the universe for this character
        universe_id = character.universe_id
        
        # Check if the universe is public or belongs to the user
        from backend.app.api.models.universe import Universe
        universe = Universe.query.get_or_404(universe_id)
        
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        data = request.get_json()

        # Update character fields
        if 'name' in data:
            character.name = data['name'].strip()
        if 'description' in data:
            character.description = data['description'].strip()

        # Validate the character
        try:
            character.validate()
        except ValueError as ve:
            return jsonify({
                'message': 'Validation error',
                'error': str(ve)
            }), 400

        db.session.commit()

        return jsonify({
            'message': 'Character updated successfully',
            'character': character.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating character: {str(e)}")
        return jsonify({
            'message': 'Error updating character',
            'error': str(e)
        }), 500

@characters_bp.route('/<int:character_id>', methods=['DELETE'])
@jwt_required()
def delete_character(character_id):
    try:
        character = Character.query.get_or_404(character_id)
        user_id = get_jwt_identity()
        
        # Get the universe for this character
        universe_id = character.universe_id
        
        # Check if the universe is public or belongs to the user
        from backend.app.api.models.universe import Universe
        universe = Universe.query.get_or_404(universe_id)
        
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # First, remove any character-scene relationships
        if character.scenes:
            for scene in character.scenes:
                character.scenes.remove(scene)
            
        # Then soft delete the character
        character.is_deleted = True
        db.session.commit()

        return jsonify({
            'message': 'Character deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error deleting character: {str(e)}")
        return jsonify({
            'message': 'Error deleting character',
            'error': str(e)
        }), 500
