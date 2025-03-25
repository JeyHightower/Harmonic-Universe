from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.models import db, Physics2D, Physics3D, PhysicsObject, PhysicsParameter, PhysicsConstraint, Universe, Scene, Character
from sqlalchemy.exc import SQLAlchemyError

physics_bp = Blueprint('physics', __name__, url_prefix='/api/physics')

# 2D Physics Routes
@physics_bp.route('/2d', methods=['GET'])
def get_physics_2d_list():
    """Get a list of all 2D physics settings"""
    try:
        physics_list = Physics2D.query.all()
        return jsonify({
            'success': True,
            'data': [p.to_dict() for p in physics_list]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/2d/<int:id>', methods=['GET'])
def get_physics_2d(id):
    """Get a specific 2D physics setting by ID"""
    try:
        physics = Physics2D.query.get(id)
        if not physics:
            return jsonify({
                'success': False,
                'error': 'Physics setting not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': physics.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/2d', methods=['POST'])
@jwt_required()
def create_physics_2d():
    """Create a new 2D physics setting"""
    data = request.json
    
    try:
        physics = Physics2D(
            name=data.get('name'),
            description=data.get('description'),
            gravity_x=data.get('gravity_x', 0.0),
            gravity_y=data.get('gravity_y', 9.8),
            friction=data.get('friction', 0.1),
            restitution=data.get('restitution', 0.5),
            linear_damping=data.get('linear_damping', 0.1),
            angular_damping=data.get('angular_damping', 0.1),
            time_scale=data.get('time_scale', 1.0),
            universe_id=data.get('universe_id'),
            scene_id=data.get('scene_id')
        )
        
        db.session.add(physics)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': physics.to_dict()
        }), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/2d/<int:id>', methods=['PUT'])
@jwt_required()
def update_physics_2d(id):
    """Update a specific 2D physics setting"""
    data = request.json
    
    try:
        physics = Physics2D.query.get(id)
        if not physics:
            return jsonify({
                'success': False,
                'error': 'Physics setting not found'
            }), 404
        
        physics.name = data.get('name', physics.name)
        physics.description = data.get('description', physics.description)
        physics.gravity_x = data.get('gravity_x', physics.gravity_x)
        physics.gravity_y = data.get('gravity_y', physics.gravity_y)
        physics.friction = data.get('friction', physics.friction)
        physics.restitution = data.get('restitution', physics.restitution)
        physics.linear_damping = data.get('linear_damping', physics.linear_damping)
        physics.angular_damping = data.get('angular_damping', physics.angular_damping)
        physics.time_scale = data.get('time_scale', physics.time_scale)
        physics.universe_id = data.get('universe_id', physics.universe_id)
        physics.scene_id = data.get('scene_id', physics.scene_id)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': physics.to_dict()
        }), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/2d/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_physics_2d(id):
    """Delete a specific 2D physics setting"""
    try:
        physics = Physics2D.query.get(id)
        if not physics:
            return jsonify({
                'success': False,
                'error': 'Physics setting not found'
            }), 404
        
        db.session.delete(physics)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Physics setting deleted successfully'
        }), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# 3D Physics Routes
@physics_bp.route('/3d', methods=['GET'])
def get_physics_3d_list():
    """Get a list of all 3D physics settings"""
    try:
        physics_list = Physics3D.query.all()
        return jsonify({
            'success': True,
            'data': [p.to_dict() for p in physics_list]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/3d/<int:id>', methods=['GET'])
def get_physics_3d(id):
    """Get a specific 3D physics setting by ID"""
    try:
        physics = Physics3D.query.get(id)
        if not physics:
            return jsonify({
                'success': False,
                'error': 'Physics setting not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': physics.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/3d', methods=['POST'])
@jwt_required()
def create_physics_3d():
    """Create a new 3D physics setting"""
    data = request.json
    
    try:
        physics = Physics3D(
            name=data.get('name'),
            description=data.get('description'),
            gravity_x=data.get('gravity_x', 0.0),
            gravity_y=data.get('gravity_y', -9.8),
            gravity_z=data.get('gravity_z', 0.0),
            friction=data.get('friction', 0.3),
            restitution=data.get('restitution', 0.5),
            linear_damping=data.get('linear_damping', 0.05),
            angular_damping=data.get('angular_damping', 0.05),
            collision_margin=data.get('collision_margin', 0.04),
            continuous_detection=data.get('continuous_detection', True),
            substeps=data.get('substeps', 2),
            solver_iterations=data.get('solver_iterations', 10),
            time_scale=data.get('time_scale', 1.0),
            universe_id=data.get('universe_id'),
            scene_id=data.get('scene_id')
        )
        
        db.session.add(physics)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': physics.to_dict()
        }), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/3d/<int:id>', methods=['PUT'])
@jwt_required()
def update_physics_3d(id):
    """Update a specific 3D physics setting"""
    data = request.json
    
    try:
        physics = Physics3D.query.get(id)
        if not physics:
            return jsonify({
                'success': False,
                'error': 'Physics setting not found'
            }), 404
        
        # Update fields from request data
        for key, value in data.items():
            if hasattr(physics, key):
                setattr(physics, key, value)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': physics.to_dict()
        }), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/3d/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_physics_3d(id):
    """Delete a specific 3D physics setting"""
    try:
        physics = Physics3D.query.get(id)
        if not physics:
            return jsonify({
                'success': False,
                'error': 'Physics setting not found'
            }), 404
        
        db.session.delete(physics)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Physics setting deleted successfully'
        }), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Physics Objects Routes
@physics_bp.route('/objects', methods=['GET'])
def get_physics_objects():
    """Get a list of all physics objects, optionally filtered by scene, universe, or character"""
    try:
        scene_id = request.args.get('scene_id', type=int)
        universe_id = request.args.get('universe_id', type=int)
        character_id = request.args.get('character_id', type=int)
        
        query = PhysicsObject.query
        
        if scene_id:
            query = query.filter_by(scene_id=scene_id)
        if universe_id:
            query = query.filter_by(universe_id=universe_id)
        if character_id:
            query = query.filter_by(character_id=character_id)
            
        objects = query.all()
        
        return jsonify({
            'success': True,
            'data': [obj.to_dict() for obj in objects]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/objects/<int:id>', methods=['GET'])
def get_physics_object(id):
    """Get a specific physics object by ID"""
    try:
        obj = PhysicsObject.query.get(id)
        if not obj:
            return jsonify({
                'success': False,
                'error': 'Physics object not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': obj.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/objects', methods=['POST'])
@jwt_required()
def create_physics_object():
    """Create a new physics object"""
    data = request.json
    
    try:
        obj = PhysicsObject(
            name=data.get('name'),
            description=data.get('description'),
            object_type=data.get('object_type'),
            is_static=data.get('is_static', False),
            is_2d=data.get('is_2d', True),
            position_x=data.get('position_x', 0.0),
            position_y=data.get('position_y', 0.0),
            position_z=data.get('position_z', 0.0),
            rotation_x=data.get('rotation_x', 0.0),
            rotation_y=data.get('rotation_y', 0.0),
            rotation_z=data.get('rotation_z', 0.0),
            scale_x=data.get('scale_x', 1.0),
            scale_y=data.get('scale_y', 1.0),
            scale_z=data.get('scale_z', 1.0),
            mass=data.get('mass', 1.0),
            friction=data.get('friction', 0.3),
            restitution=data.get('restitution', 0.5),
            linear_damping=data.get('linear_damping', 0.05),
            angular_damping=data.get('angular_damping', 0.05),
            collision_group=data.get('collision_group', 1),
            collision_mask=data.get('collision_mask', 1),
            universe_id=data.get('universe_id'),
            scene_id=data.get('scene_id'),
            character_id=data.get('character_id')
        )
        
        db.session.add(obj)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': obj.to_dict()
        }), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/objects/<int:id>', methods=['PUT'])
@jwt_required()
def update_physics_object(id):
    """Update a specific physics object"""
    data = request.json
    
    try:
        obj = PhysicsObject.query.get(id)
        if not obj:
            return jsonify({
                'success': False,
                'error': 'Physics object not found'
            }), 404
        
        # Update fields from request data
        for key, value in data.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': obj.to_dict()
        }), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/objects/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_physics_object(id):
    """Delete a specific physics object"""
    try:
        obj = PhysicsObject.query.get(id)
        if not obj:
            return jsonify({
                'success': False,
                'error': 'Physics object not found'
            }), 404
        
        db.session.delete(obj)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Physics object deleted successfully'
        }), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Physics Constraints Routes
@physics_bp.route('/constraints', methods=['GET'])
def get_physics_constraints():
    """Get all physics constraints, optionally filtered by scene"""
    try:
        scene_id = request.args.get('scene_id', type=int)
        object_id = request.args.get('object_id', type=int)
        
        query = PhysicsConstraint.query
        
        if scene_id:
            query = query.filter_by(scene_id=scene_id)
        if object_id:
            query = query.filter((PhysicsConstraint.object_a_id == object_id) | 
                                (PhysicsConstraint.object_b_id == object_id))
            
        constraints = query.all()
        
        return jsonify({
            'success': True,
            'data': [c.to_dict() for c in constraints]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/constraints/<int:id>', methods=['GET'])
def get_physics_constraint(id):
    """Get a specific physics constraint by ID"""
    try:
        constraint = PhysicsConstraint.query.get(id)
        if not constraint:
            return jsonify({
                'success': False,
                'error': 'Physics constraint not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': constraint.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/constraints', methods=['POST'])
@jwt_required()
def create_physics_constraint():
    """Create a new physics constraint"""
    data = request.json
    
    try:
        constraint = PhysicsConstraint(
            name=data.get('name'),
            description=data.get('description'),
            constraint_type=data.get('constraint_type'),
            object_a_id=data.get('object_a_id'),
            object_b_id=data.get('object_b_id'),
            breaking_threshold=data.get('breaking_threshold'),
            position_x=data.get('position_x', 0.0),
            position_y=data.get('position_y', 0.0),
            position_z=data.get('position_z', 0.0),
            axis_x=data.get('axis_x', 0.0),
            axis_y=data.get('axis_y', 1.0),
            axis_z=data.get('axis_z', 0.0),
            limit_lower=data.get('limit_lower'),
            limit_upper=data.get('limit_upper'),
            spring_stiffness=data.get('spring_stiffness'),
            spring_damping=data.get('spring_damping'),
            is_2d=data.get('is_2d', True),
            is_enabled=data.get('is_enabled', True),
            scene_id=data.get('scene_id')
        )
        
        db.session.add(constraint)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': constraint.to_dict()
        }), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/constraints/<int:id>', methods=['PUT'])
@jwt_required()
def update_physics_constraint(id):
    """Update a specific physics constraint"""
    data = request.json
    
    try:
        constraint = PhysicsConstraint.query.get(id)
        if not constraint:
            return jsonify({
                'success': False,
                'error': 'Physics constraint not found'
            }), 404
        
        # Update fields from request data
        for key, value in data.items():
            if hasattr(constraint, key):
                setattr(constraint, key, value)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': constraint.to_dict()
        }), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@physics_bp.route('/constraints/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_physics_constraint(id):
    """Delete a specific physics constraint"""
    try:
        constraint = PhysicsConstraint.query.get(id)
        if not constraint:
            return jsonify({
                'success': False,
                'error': 'Physics constraint not found'
            }), 404
        
        db.session.delete(constraint)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Physics constraint deleted successfully'
        }), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 