"""
Music routes.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.scene import Scene
from app.models.universe import Universe

music_bp = Blueprint('music', __name__, url_prefix='/music')

@music_bp.route('/universes/<uuid:universe_id>/parameters', methods=['GET'])
@jwt_required()
def get_universe_music_parameters(universe_id):
    """Get universe music parameters."""
    try:
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404
        return jsonify(universe.music_parameters), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@music_bp.route('/universes/<uuid:universe_id>/parameters', methods=['PUT'])
@jwt_required()
def update_universe_music_parameters(universe_id):
    """Update universe music parameters."""
    try:
        # Check if universe exists
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        # Check if current user is the creator
        current_user_id = get_jwt_identity()
        if str(universe.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        # Update music parameters
        universe.music_parameters = request.json
        db.session.commit()

        return jsonify(universe.music_parameters), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@music_bp.route('/scenes/<uuid:scene_id>/parameters', methods=['GET'])
@jwt_required()
def get_scene_music_parameters(scene_id):
    """Get scene music parameters."""
    try:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404
        return jsonify(scene.music_parameters), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@music_bp.route('/scenes/<uuid:scene_id>/parameters', methods=['PUT'])
@jwt_required()
def update_scene_music_parameters(scene_id):
    """Update scene music parameters."""
    try:
        # Check if scene exists
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        # Check if current user is the creator
        current_user_id = get_jwt_identity()
        if str(scene.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        # Update music parameters
        scene.music_parameters = request.json
        db.session.commit()

        return jsonify(scene.music_parameters), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@music_bp.route('/scenes/<uuid:scene_id>/generate', methods=['POST'])
@jwt_required()
def generate_scene_music(scene_id):
    """Generate scene music."""
    try:
        # Check if scene exists
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        # TODO: Implement music generation
        # This is a placeholder response
        generation_result = {
            'status': 'success',
            'audio_data': None,
            'metadata': {
                'duration': 0.0,
                'sample_rate': 44100,
                'channels': 2,
                'music_parameters': scene.music_parameters
            }
        }

        return jsonify(generation_result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
