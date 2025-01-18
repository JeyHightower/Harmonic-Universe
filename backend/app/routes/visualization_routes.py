from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from ..extensions import db
from ..models import Universe, VisualizationParameters
from ..extensions import limiter
from ..utils.auth import check_universe_access

visualization_bp = Blueprint('visualization', __name__)

@visualization_bp.route('/universes/<int:universe_id>/visualization', methods=['PUT'])
@jwt_required()
@limiter.limit("50 per hour")
def update_visualization_parameters(universe_id):
    """Update visualization parameters for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id, require_ownership=True):
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        if not universe.visualization_parameters:
            universe.visualization_parameters = VisualizationParameters(universe_id=universe_id)

        # Update color parameters
        if 'background_color' in data:
            universe.visualization_parameters.background_color = data['background_color']
        if 'particle_color' in data:
            universe.visualization_parameters.particle_color = data['particle_color']
        if 'glow_color' in data:
            universe.visualization_parameters.glow_color = data['glow_color']

        # Update particle system parameters
        if 'particle_count' in data:
            universe.visualization_parameters.particle_count = data['particle_count']
        if 'particle_size' in data:
            universe.visualization_parameters.particle_size = data['particle_size']
        if 'particle_speed' in data:
            universe.visualization_parameters.particle_speed = data['particle_speed']

        # Update visual effects
        if 'glow_intensity' in data:
            universe.visualization_parameters.glow_intensity = data['glow_intensity']
        if 'blur_amount' in data:
            universe.visualization_parameters.blur_amount = data['blur_amount']
        if 'trail_length' in data:
            universe.visualization_parameters.trail_length = data['trail_length']

        # Update animation parameters
        if 'animation_speed' in data:
            universe.visualization_parameters.animation_speed = data['animation_speed']
        if 'bounce_factor' in data:
            universe.visualization_parameters.bounce_factor = data['bounce_factor']
        if 'rotation_speed' in data:
            universe.visualization_parameters.rotation_speed = data['rotation_speed']

        # Update camera parameters
        if 'camera_zoom' in data:
            universe.visualization_parameters.camera_zoom = data['camera_zoom']
        if 'camera_rotation' in data:
            universe.visualization_parameters.camera_rotation = data['camera_rotation']

        db.session.commit()
        return jsonify(universe.visualization_parameters.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@visualization_bp.route('/universes/<int:universe_id>/visualization', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_visualization_parameters(universe_id):
    """Get visualization parameters for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        if not universe.visualization_parameters:
            universe.visualization_parameters = VisualizationParameters(universe_id=universe_id)
            db.session.commit()

        return jsonify(universe.visualization_parameters.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500
