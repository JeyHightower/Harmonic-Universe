from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Scene, Universe
from ...models.character import Character
from ....extensions import db

from . import characters_bp

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
        current_app.logger.error(f"Error creating character: {str(e)}")
        return jsonify({
            'message': 'Error creating character',
            'error': str(e)
        }), 500 