from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Scene, Universe
from ...models.character import Character
from ....extensions import db

from . import characters_bp

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