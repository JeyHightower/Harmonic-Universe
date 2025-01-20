from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from ..extensions import db, limiter
from ..models import Universe, PhysicsParameters, VisualizationParameters
from ..utils.auth import check_universe_access
from ..services.physics_simulator import PhysicsSimulator
from ..services.visualization_renderer import VisualizationRenderer

visualization_bp = Blueprint('visualization', __name__, url_prefix='/api/visualization')

@visualization_bp.route('/settings/<int:universe_id>', methods=['POST'])
@jwt_required()
@limiter.limit("30 per hour")
def create_settings(universe_id):
    """Create visualization and physics settings for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No settings provided'}), 400

        # Create physics settings
        physics_settings = PhysicsParameters(
            universe_id=universe_id,
            gravity=data.get('gravity', 9.81),
            friction=data.get('friction', 0.5),
            elasticity=data.get('elasticity', 0.7),
            air_resistance=data.get('air_resistance', 0.1),
            density=data.get('density', 1.0)
        )

        # Create visualization settings
        vis_settings = VisualizationParameters(
            universe_id=universe_id,
            color_scheme=data.get('color_scheme', 'default'),
            particle_density=data.get('particle_density', 1000),
            particle_size=data.get('particle_size', 2.0),
            blur_amount=data.get('blur_amount', 0.5),
            glow_intensity=data.get('glow_intensity', 0.7)
        )

        db.session.add(physics_settings)
        db.session.add(vis_settings)
        db.session.commit()

        return jsonify({
            'physics': physics_settings.to_dict(),
            'visualization': vis_settings.to_dict()
        }), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@visualization_bp.route('/settings/<int:universe_id>', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_settings(universe_id):
    """Get visualization and physics settings for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        physics_settings = PhysicsParameters.query.filter_by(universe_id=universe_id).first()
        vis_settings = VisualizationParameters.query.filter_by(universe_id=universe_id).first()

        if not physics_settings or not vis_settings:
            return jsonify({'error': 'Settings not found'}), 404

        return jsonify({
            'physics': physics_settings.to_dict(),
            'visualization': vis_settings.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@visualization_bp.route('/settings/<int:universe_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("50 per hour")
def update_settings(universe_id):
    """Update visualization and physics settings for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No update data provided'}), 400

        physics_settings = PhysicsParameters.query.filter_by(universe_id=universe_id).first()
        vis_settings = VisualizationParameters.query.filter_by(universe_id=universe_id).first()

        if not physics_settings or not vis_settings:
            return jsonify({'error': 'Settings not found'}), 404

        # Update physics settings
        if 'gravity' in data:
            physics_settings.gravity = data['gravity']
        if 'friction' in data:
            physics_settings.friction = data['friction']
        if 'elasticity' in data:
            physics_settings.elasticity = data['elasticity']
        if 'air_resistance' in data:
            physics_settings.air_resistance = data['air_resistance']
        if 'density' in data:
            physics_settings.density = data['density']

        # Update visualization settings
        if 'color_scheme' in data:
            vis_settings.color_scheme = data['color_scheme']
        if 'particle_density' in data:
            vis_settings.particle_density = data['particle_density']
        if 'particle_size' in data:
            vis_settings.particle_size = data['particle_size']
        if 'blur_amount' in data:
            vis_settings.blur_amount = data['blur_amount']
        if 'glow_intensity' in data:
            vis_settings.glow_intensity = data['glow_intensity']

        db.session.commit()

        return jsonify({
            'physics': physics_settings.to_dict(),
            'visualization': vis_settings.to_dict()
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@visualization_bp.route('/render/<int:universe_id>', methods=['POST'])
@jwt_required()
@limiter.limit("10 per hour")
def render_visualization(universe_id):
    """Generate visualization for a universe based on its settings"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        physics_settings = PhysicsParameters.query.filter_by(universe_id=universe_id).first()
        vis_settings = VisualizationParameters.query.filter_by(universe_id=universe_id).first()

        if not physics_settings or not vis_settings:
            return jsonify({'error': 'Settings not found'}), 404

        # Generate visualization using combined settings
        physics_service = PhysicsSimulator()
        vis_service = VisualizationRenderer()

        physics_data = physics_service.simulate_physics(physics_settings)
        visualization = vis_service.generate_visualization(vis_settings, physics_data)

        return jsonify({
            'visualization_url': visualization['url'],
            'frame_count': visualization['frame_count'],
            'format': visualization['format']
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
