"""
Physics routes.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.scene import Scene
from app.models.universe import Universe
from app.models import db, PhysicsObject, PhysicsConstraint
from app.utils.validation import validate_physics_object, validate_physics_constraint

physics_bp = Blueprint('physics', __name__, url_prefix='/physics')

@physics_bp.route('/universes/<uuid:universe_id>/parameters', methods=['GET'])
@jwt_required()
def get_universe_physics_parameters(universe_id):
    """Get universe physics parameters."""
    try:
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404
        return jsonify(universe.physics_parameters), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@physics_bp.route('/universes/<uuid:universe_id>/parameters', methods=['PUT'])
@jwt_required()
def update_universe_physics_parameters(universe_id):
    """Update universe physics parameters."""
    try:
        # Check if universe exists
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        # Check if current user is the creator
        current_user_id = get_jwt_identity()
        if str(universe.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        # Update physics parameters
        universe.physics_parameters = request.json
        db.session.commit()

        return jsonify(universe.physics_parameters), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@physics_bp.route('/scenes/<uuid:scene_id>/parameters', methods=['GET'])
@jwt_required()
def get_scene_physics_parameters(scene_id):
    """Get scene physics parameters."""
    try:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404
        return jsonify(scene.physics_parameters), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@physics_bp.route('/scenes/<uuid:scene_id>/parameters', methods=['PUT'])
@jwt_required()
def update_scene_physics_parameters(scene_id):
    """Update scene physics parameters."""
    try:
        # Check if scene exists
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        # Check if current user is the creator
        current_user_id = get_jwt_identity()
        if str(scene.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        # Update physics parameters
        scene.physics_parameters = request.json
        db.session.commit()

        return jsonify(scene.physics_parameters), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@physics_bp.route('/scenes/<uuid:scene_id>/simulate', methods=['POST'])
@jwt_required()
def simulate_scene(scene_id):
    """Simulate scene physics."""
    try:
        # Check if scene exists
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        # TODO: Implement physics simulation
        # This is a placeholder response
        simulation_result = {
            'status': 'success',
            'frames': [],
            'metadata': {
                'duration': 0.0,
                'frame_count': 0,
                'physics_parameters': scene.physics_parameters
            }
        }

        return jsonify(simulation_result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Physics Object Routes
@physics_bp.route('/scenes/<uuid:scene_id>/physics/objects', methods=['POST'])
@jwt_required()
def create_physics_object(scene_id):
    """Create a new physics object."""
    try:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        current_user_id = get_jwt_identity()
        if str(scene.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        data = request.get_json()
        validation_error = validate_physics_object(data)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        physics_object = PhysicsObject(scene_id=scene_id, **data)
        db.session.add(physics_object)
        db.session.commit()
        return jsonify(physics_object.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@physics_bp.route('/scenes/<uuid:scene_id>/physics/objects/<int:object_id>', methods=['GET'])
@jwt_required()
def get_physics_object(scene_id, object_id):
    """Get a specific physics object."""
    try:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        physics_object = PhysicsObject.query.filter_by(id=object_id, scene_id=scene_id).first()
        if not physics_object:
            return jsonify({'error': 'Physics object not found'}), 404

        return jsonify(physics_object.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@physics_bp.route('/scenes/<uuid:scene_id>/physics/objects/<int:object_id>', methods=['PUT'])
@jwt_required()
def update_physics_object(scene_id, object_id):
    """Update a physics object."""
    try:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        physics_object = PhysicsObject.query.filter_by(id=object_id, scene_id=scene_id).first()
        if not physics_object:
            return jsonify({'error': 'Physics object not found'}), 404

        current_user_id = get_jwt_identity()
        if str(scene.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        data = request.get_json()
        validation_error = validate_physics_object(data, update=True)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        for key, value in data.items():
            if hasattr(physics_object, key):
                setattr(physics_object, key, value)

        db.session.commit()
        return jsonify(physics_object.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@physics_bp.route('/scenes/<uuid:scene_id>/physics/objects/<int:object_id>', methods=['DELETE'])
@jwt_required()
def delete_physics_object(scene_id, object_id):
    """Delete a physics object."""
    try:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        physics_object = PhysicsObject.query.filter_by(id=object_id, scene_id=scene_id).first()
        if not physics_object:
            return jsonify({'error': 'Physics object not found'}), 404

        current_user_id = get_jwt_identity()
        if str(scene.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        db.session.delete(physics_object)
        db.session.commit()
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Physics Constraint Routes
@physics_bp.route('/scenes/<uuid:scene_id>/physics/constraints', methods=['POST'])
@jwt_required()
def create_physics_constraint(scene_id):
    """Create a new physics constraint."""
    try:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        current_user_id = get_jwt_identity()
        if str(scene.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        data = request.get_json()
        validation_error = validate_physics_constraint(data)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        constraint = PhysicsConstraint(scene_id=scene_id, **data)
        db.session.add(constraint)
        db.session.commit()
        return jsonify(constraint.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@physics_bp.route('/scenes/<uuid:scene_id>/physics/constraints/<int:constraint_id>', methods=['GET'])
@jwt_required()
def get_physics_constraint(scene_id, constraint_id):
    """Get a specific physics constraint."""
    try:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        constraint = PhysicsConstraint.query.filter_by(id=constraint_id, scene_id=scene_id).first()
        if not constraint:
            return jsonify({'error': 'Physics constraint not found'}), 404

        return jsonify(constraint.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@physics_bp.route('/scenes/<uuid:scene_id>/physics/constraints/<int:constraint_id>', methods=['PUT'])
@jwt_required()
def update_physics_constraint(scene_id, constraint_id):
    """Update a physics constraint."""
    try:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        constraint = PhysicsConstraint.query.filter_by(id=constraint_id, scene_id=scene_id).first()
        if not constraint:
            return jsonify({'error': 'Physics constraint not found'}), 404

        current_user_id = get_jwt_identity()
        if str(scene.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        data = request.get_json()
        validation_error = validate_physics_constraint(data, update=True)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        for key, value in data.items():
            if hasattr(constraint, key):
                setattr(constraint, key, value)

        db.session.commit()
        return jsonify(constraint.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@physics_bp.route('/scenes/<uuid:scene_id>/physics/constraints/<int:constraint_id>', methods=['DELETE'])
@jwt_required()
def delete_physics_constraint(scene_id, constraint_id):
    """Delete a physics constraint."""
    try:
        scene = Scene.query.get(scene_id)
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        constraint = PhysicsConstraint.query.filter_by(id=constraint_id, scene_id=scene_id).first()
        if not constraint:
            return jsonify({'error': 'Physics constraint not found'}), 404

        current_user_id = get_jwt_identity()
        if str(scene.creator_id) != current_user_id:
            return jsonify({'error': 'Not authorized'}), 403

        db.session.delete(constraint)
        db.session.commit()
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 400
