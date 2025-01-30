"""Physics routes for the API."""
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from ..models import db, Scene, PhysicsObject, PhysicsConstraint
from ..utils.auth import check_universe_access
from ..utils.validation import (
    validate_physics_object,
    validate_physics_constraint,
    validate_simulation_settings
)
from datetime import datetime

bp = Blueprint('physics', __name__)

# Physics Object Routes

@bp.route('/api/scenes/<int:scene_id>/physics/objects', methods=['POST'])
@login_required
def create_physics_object(scene_id):
    """Create a new physics object."""
    scene = Scene.query.get_or_404(scene_id)
    if not check_universe_access(scene.storyboard.universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    validation_error = validate_physics_object(data)
    if validation_error:
        return jsonify({'error': validation_error}), 400

    try:
        physics_object = PhysicsObject(
            scene_id=scene_id,
            name=data['name'],
            object_type=data['object_type'],
            mass=data.get('mass', 1.0),
            position=data['position'],
            dimensions=data['dimensions'],
            is_static=data.get('is_static', False),
            is_sensor=data.get('is_sensor', False),
            restitution=data.get('restitution', 0.6),
            friction=data.get('friction', 0.1),
            collision_filter=data.get('collision_filter', {"category": 1, "mask": 0xFFFFFFFF})
        )
        physics_object.validate_object_type()
        physics_object.validate_physics_properties()

        db.session.add(physics_object)
        db.session.commit()
        return jsonify(physics_object.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/scenes/<int:scene_id>/physics/objects/<int:object_id>', methods=['GET'])
@login_required
def get_physics_object(scene_id, object_id):
    """Get a specific physics object."""
    scene = Scene.query.get_or_404(scene_id)
    if not check_universe_access(scene.storyboard.universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    physics_object = PhysicsObject.query.filter_by(
        id=object_id,
        scene_id=scene_id
    ).first_or_404()

    return jsonify(physics_object.to_dict())

@bp.route('/api/scenes/<int:scene_id>/physics/objects/<int:object_id>', methods=['PUT'])
@login_required
def update_physics_object(scene_id, object_id):
    """Update a physics object."""
    scene = Scene.query.get_or_404(scene_id)
    if not check_universe_access(scene.storyboard.universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    physics_object = PhysicsObject.query.filter_by(
        id=object_id,
        scene_id=scene_id
    ).first_or_404()

    data = request.get_json()
    validation_error = validate_physics_object(data, update=True)
    if validation_error:
        return jsonify({'error': validation_error}), 400

    try:
        for key, value in data.items():
            if hasattr(physics_object, key):
                setattr(physics_object, key, value)

        physics_object.validate_object_type()
        physics_object.validate_physics_properties()

        db.session.commit()
        return jsonify(physics_object.to_dict())
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/scenes/<int:scene_id>/physics/objects/<int:object_id>', methods=['DELETE'])
@login_required
def delete_physics_object(scene_id, object_id):
    """Delete a physics object."""
    scene = Scene.query.get_or_404(scene_id)
    if not check_universe_access(scene.storyboard.universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    physics_object = PhysicsObject.query.filter_by(
        id=object_id,
        scene_id=scene_id
    ).first_or_404()

    try:
        db.session.delete(physics_object)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Physics Constraint Routes

@bp.route('/api/scenes/<int:scene_id>/physics/constraints', methods=['POST'])
@login_required
def create_physics_constraint(scene_id):
    """Create a new physics constraint."""
    scene = Scene.query.get_or_404(scene_id)
    if not check_universe_access(scene.storyboard.universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    validation_error = validate_physics_constraint(data)
    if validation_error:
        return jsonify({'error': validation_error}), 400

    try:
        constraint = PhysicsConstraint(
            scene_id=scene_id,
            name=data['name'],
            constraint_type=data['constraint_type'],
            object_a_id=data['object_a_id'],
            object_b_id=data['object_b_id'],
            anchor_a=data['anchor_a'],
            anchor_b=data['anchor_b'],
            stiffness=data.get('stiffness', 1.0),
            damping=data.get('damping', 0.7),
            properties=data.get('properties', {})
        )
        constraint.validate_constraint_type()

        db.session.add(constraint)
        db.session.commit()
        return jsonify(constraint.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/scenes/<int:scene_id>/physics/constraints/<int:constraint_id>', methods=['GET'])
@login_required
def get_physics_constraint(scene_id, constraint_id):
    """Get a specific physics constraint."""
    scene = Scene.query.get_or_404(scene_id)
    if not check_universe_access(scene.storyboard.universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    constraint = PhysicsConstraint.query.filter_by(
        id=constraint_id,
        scene_id=scene_id
    ).first_or_404()

    return jsonify(constraint.to_dict())

@bp.route('/api/scenes/<int:scene_id>/physics/constraints/<int:constraint_id>', methods=['PUT'])
@login_required
def update_physics_constraint(scene_id, constraint_id):
    """Update a physics constraint."""
    scene = Scene.query.get_or_404(scene_id)
    if not check_universe_access(scene.storyboard.universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    constraint = PhysicsConstraint.query.filter_by(
        id=constraint_id,
        scene_id=scene_id
    ).first_or_404()

    data = request.get_json()
    validation_error = validate_physics_constraint(data, update=True)
    if validation_error:
        return jsonify({'error': validation_error}), 400

    try:
        for key, value in data.items():
            if hasattr(constraint, key):
                setattr(constraint, key, value)

        constraint.validate_constraint_type()

        db.session.commit()
        return jsonify(constraint.to_dict())
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/scenes/<int:scene_id>/physics/constraints/<int:constraint_id>', methods=['DELETE'])
@login_required
def delete_physics_constraint(scene_id, constraint_id):
    """Delete a physics constraint."""
    scene = Scene.query.get_or_404(scene_id)
    if not check_universe_access(scene.storyboard.universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    constraint = PhysicsConstraint.query.filter_by(
        id=constraint_id,
        scene_id=scene_id
    ).first_or_404()

    try:
        db.session.delete(constraint)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Physics Simulation Routes

@bp.route('/api/scenes/<int:scene_id>/physics/simulate/start', methods=['POST'])
@login_required
def start_simulation(scene_id):
    """Start the physics simulation."""
    scene = Scene.query.get_or_404(scene_id)
    if not check_universe_access(scene.storyboard.universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        scene.physics_settings['enabled'] = True
        db.session.commit()
        return jsonify({
            'status': 'running',
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/scenes/<int:scene_id>/physics/simulate/stop', methods=['POST'])
@login_required
def stop_simulation(scene_id):
    """Stop the physics simulation."""
    scene = Scene.query.get_or_404(scene_id)
    if not check_universe_access(scene.storyboard.universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        scene.physics_settings['enabled'] = False
        db.session.commit()
        return jsonify({
            'status': 'stopped',
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/scenes/<int:scene_id>/physics/simulate/step', methods=['POST'])
@login_required
def step_simulation(scene_id):
    """Step the physics simulation."""
    scene = Scene.query.get_or_404(scene_id)
    if not check_universe_access(scene.storyboard.universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        # Perform one step of physics simulation
        updated_objects = []
        for obj in scene.physics_objects:
            if not obj.is_static:
                # Apply gravity
                gravity = scene.physics_settings['gravity']
                obj.apply_force(
                    gravity['x'] * obj.mass,
                    gravity['y'] * obj.mass
                )
                # Update position based on velocity and acceleration
                time_step = scene.physics_settings['time_step']
                obj.position['x'] += obj.velocity['x'] * time_step
                obj.position['y'] += obj.velocity['y'] * time_step
                obj.velocity['x'] += obj.acceleration['x'] * time_step
                obj.velocity['y'] += obj.acceleration['y'] * time_step
                updated_objects.append(obj.to_dict())

        db.session.commit()
        return jsonify({'objects': updated_objects})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/scenes/<int:scene_id>/physics/simulate/state', methods=['GET'])
@login_required
def get_simulation_state(scene_id):
    """Get the current state of the physics simulation."""
    scene = Scene.query.get_or_404(scene_id)
    if not check_universe_access(scene.storyboard.universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({
        'status': 'running' if scene.physics_settings['enabled'] else 'stopped',
        'timestamp': datetime.utcnow().isoformat(),
        'objects': [obj.to_dict() for obj in scene.physics_objects]
    })
