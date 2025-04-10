from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Universe, Scene
from ...models.character import Character
from ...models.note import Note
from ....extensions import db

from . import universes_bp

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

        characters = Character.query.filter_by(universe_id=universe_id, is_deleted=False).all()
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

@universes_bp.route('/<int:universe_id>/scenes', methods=['GET'])
@jwt_required()
def get_universe_scenes(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Check if user has access to this universe
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        scenes = Scene.query.filter_by(universe_id=universe_id, is_deleted=False).all()
        return jsonify({
            'message': 'Scenes retrieved successfully',
            'scenes': [scene.to_dict() for scene in scenes]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving scenes for universe {universe_id}: {str(e)}")
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

        notes = Note.query.filter_by(universe_id=universe_id, is_deleted=False).all()
        
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