from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.models.character import Character
from app.api.models.scene import Scene
from app import db

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

        # Get all characters for the scene
        characters = Character.query.filter_by(
            scene_id=scene_id,
            is_deleted=False
        ).all()

        return jsonify({
            'message': 'Characters retrieved successfully',
            'characters': [character.to_dict() for character in characters]
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

        # Check if user has access to this character's scene's universe
        if not character.scene.universe.is_public and character.scene.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        return jsonify({
            'message': 'Character retrieved successfully',
            'character': character.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Error retrieving character',
            'error': str(e)
        }), 500

@characters_bp.route('/', methods=['POST'])
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
            description=data.get('description', '').strip(),
            scene_id=scene_id
        )

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

        # Check if user has access to this character's scene's universe
        if not character.scene.universe.is_public and character.scene.universe.user_id != user_id:
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

        # Check if user has access to this character's scene's universe
        if not character.scene.universe.is_public and character.scene.universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        # Soft delete the character
        character.is_deleted = True
        db.session.commit()

        return jsonify({
            'message': 'Character deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error deleting character',
            'error': str(e)
        }), 500
