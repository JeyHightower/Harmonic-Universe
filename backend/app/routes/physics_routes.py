from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from ..extensions import db
from ..models import Universe, PhysicsParameters
from ..extensions import limiter
from ..utils.auth import check_universe_access

physics_bp = Blueprint('physics', __name__)

@physics_bp.route('/universes/<int:universe_id>/physics', methods=['PUT'])
@jwt_required()
@limiter.limit("50 per hour")
def update_physics_parameters(universe_id):
    """Update physics parameters for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id, require_ownership=True):
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        if not universe.physics_parameters:
            universe.physics_parameters = PhysicsParameters(universe_id=universe_id)

        # Update physics parameters
        if 'gravity' in data:
            universe.physics_parameters.gravity = data['gravity']
        if 'friction' in data:
            universe.physics_parameters.friction = data['friction']
        if 'elasticity' in data:
            universe.physics_parameters.elasticity = data['elasticity']
        if 'air_resistance' in data:
            universe.physics_parameters.air_resistance = data['air_resistance']
        if 'density' in data:
            universe.physics_parameters.density = data['density']

        db.session.commit()
        return jsonify(universe.physics_parameters.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@physics_bp.route('/universes/<int:universe_id>/physics', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_physics_parameters(universe_id):
    """Get physics parameters for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        if not universe.physics_parameters:
            universe.physics_parameters = PhysicsParameters(universe_id=universe_id)
            db.session.commit()

        return jsonify(universe.physics_parameters.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500
