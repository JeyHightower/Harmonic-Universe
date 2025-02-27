"""Physics parameters routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.db.session import get_db
from app.models.physics.parameters import PhysicsParameters
from app.models.universe import Universe
from app.core.errors import ValidationError, NotFoundError, AuthorizationError
import logging

physics_parameters_bp = Blueprint('physics_parameters', __name__)
logger = logging.getLogger(__name__)

@physics_parameters_bp.route('/', methods=['POST'])
@jwt_required()
def create_physics_parameters():
    """Create new physics parameters."""
    try:
        data = request.get_json()
        if not data:
            raise ValidationError('No input data provided')

        required_fields = ['name', 'universe_id']
        if not all(field in data for field in required_fields):
            raise ValidationError(f'Missing required fields: {", ".join(required_fields)}')

        with get_db() as db:
            # Verify universe exists and user has access
            universe = db.query(Universe).filter_by(id=data['universe_id']).first()
            if not universe:
                raise NotFoundError('Universe not found')

            if universe.user_id != get_jwt_identity():
                raise AuthorizationError('Not authorized to modify this universe')

            physics_params = PhysicsParameters.from_dict(data)
            db.add(physics_params)
            db.commit()
            db.refresh(physics_params)

            return jsonify(physics_params.to_dict()), 201

    except Exception as e:
        logger.error(f"Error creating physics parameters: {str(e)}", exc_info=True)
        raise

@physics_parameters_bp.route('/<string:params_id>', methods=['GET'])
@jwt_required()
def get_physics_parameters(params_id):
    """Get physics parameters by ID."""
    try:
        with get_db() as db:
            params = db.query(PhysicsParameters).filter_by(id=params_id).first()
            if not params:
                raise NotFoundError('Physics parameters not found')

            # Verify user has access to the universe
            universe = db.query(Universe).filter_by(id=params.universe_id).first()
            if universe.user_id != get_jwt_identity():
                raise AuthorizationError('Not authorized to access these parameters')

            return jsonify(params.to_dict())

    except Exception as e:
        logger.error(f"Error fetching physics parameters: {str(e)}", exc_info=True)
        raise

@physics_parameters_bp.route('/universe/<string:universe_id>', methods=['GET'])
@jwt_required()
def list_universe_parameters(universe_id):
    """List all physics parameters for a universe."""
    try:
        with get_db() as db:
            # Verify universe exists and user has access
            universe = db.query(Universe).filter_by(id=universe_id).first()
            if not universe:
                raise NotFoundError('Universe not found')

            if universe.user_id != get_jwt_identity():
                raise AuthorizationError('Not authorized to access this universe')

            params = db.query(PhysicsParameters).filter_by(universe_id=universe_id).all()
            return jsonify([p.to_dict() for p in params])

    except Exception as e:
        logger.error(f"Error listing physics parameters: {str(e)}", exc_info=True)
        raise

@physics_parameters_bp.route('/<string:params_id>', methods=['PUT'])
@jwt_required()
def update_physics_parameters(params_id):
    """Update physics parameters."""
    try:
        data = request.get_json()
        if not data:
            raise ValidationError('No input data provided')

        with get_db() as db:
            params = db.query(PhysicsParameters).filter_by(id=params_id).first()
            if not params:
                raise NotFoundError('Physics parameters not found')

            # Verify user has access to the universe
            universe = db.query(Universe).filter_by(id=params.universe_id).first()
            if universe.user_id != get_jwt_identity():
                raise AuthorizationError('Not authorized to modify these parameters')

            # Update fields
            for key, value in data.items():
                if hasattr(params, key):
                    setattr(params, key, value)

            db.commit()
            db.refresh(params)
            return jsonify(params.to_dict())

    except Exception as e:
        logger.error(f"Error updating physics parameters: {str(e)}", exc_info=True)
        raise

@physics_parameters_bp.route('/<string:params_id>', methods=['DELETE'])
@jwt_required()
def delete_physics_parameters(params_id):
    """Delete physics parameters."""
    try:
        with get_db() as db:
            params = db.query(PhysicsParameters).filter_by(id=params_id).first()
            if not params:
                raise NotFoundError('Physics parameters not found')

            # Verify user has access to the universe
            universe = db.query(Universe).filter_by(id=params.universe_id).first()
            if universe.user_id != get_jwt_identity():
                raise AuthorizationError('Not authorized to delete these parameters')

            db.delete(params)
            db.commit()
            return jsonify({'message': 'Physics parameters deleted successfully'})

    except Exception as e:
        logger.error(f"Error deleting physics parameters: {str(e)}", exc_info=True)
        raise

@physics_parameters_bp.route('/validate', methods=['POST'])
@jwt_required()
def validate_parameters():
    """Validate physics parameters without saving."""
    try:
        data = request.get_json()
        if not data:
            raise ValidationError('No input data provided')

        # Validate required fields
        required_fields = ['name', 'universe_id']
        if not all(field in data for field in required_fields):
            raise ValidationError(f'Missing required fields: {", ".join(required_fields)}')

        # Validate numeric ranges
        if 'gravity' in data and not (0 <= data['gravity'] <= 100):
            raise ValidationError('Gravity must be between 0 and 100')

        if 'time_scale' in data and not (0.1 <= data['time_scale'] <= 10):
            raise ValidationError('Time scale must be between 0.1 and 10')

        if 'air_resistance' in data and not (0 <= data['air_resistance'] <= 1):
            raise ValidationError('Air resistance must be between 0 and 1')

        return jsonify({'message': 'Parameters are valid', 'valid': True})

    except Exception as e:
        logger.error(f"Error validating physics parameters: {str(e)}", exc_info=True)
        raise
