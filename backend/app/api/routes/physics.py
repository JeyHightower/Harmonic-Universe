from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from ..database import db
from ..models import Physics2D, Physics3D, PhysicsObject, PhysicsParameter, PhysicsConstraint, Universe, Scene, Character
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
@login_required
def create_physics_2d():
    """Create a new 2D physics setting"""
    try:
        data = request.get_json()
        
        # Get the user ID from the JWT token
        user_id = current_user.id
        
        # Create a new Physics2D instance
        physics_2d = Physics2D(
            user_id=user_id,
            gravity=data.get('gravity'),
            air_resistance=data.get('air_resistance'),
            friction=data.get('friction'),
            elasticity=data.get('elasticity'),
            universe_id=data.get('universe_id'),
            scene_id=data.get('scene_id')
        )
        
        # Add to database and commit
        db.session.add(physics_2d)
        db.session.commit()
        
        return jsonify(physics_2d.to_dict()), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@physics_bp.route('/2d/<int:id>', methods=['PUT'])
@login_required
def update_physics_2d(id):
    """Update a specific 2D physics setting"""
    try:
        # Get the physics setting
        physics_2d = Physics2D.query.filter_by(id=id, user_id=current_user.id).first_or_404()
        
        # Update fields from request data
        data = request.get_json()
        for key, value in data.items():
            if hasattr(physics_2d, key):
                setattr(physics_2d, key, value)
        
        db.session.commit()
        return jsonify(physics_2d.to_dict())
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@physics_bp.route('/2d/<int:id>', methods=['DELETE'])
@login_required
def delete_physics_2d(id):
    """Delete a specific 2D physics setting"""
    try:
        physics_2d = Physics2D.query.filter_by(id=id, user_id=current_user.id).first_or_404()
        db.session.delete(physics_2d)
        db.session.commit()
        return jsonify({'message': 'Physics 2D setting deleted successfully'})
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
@login_required
def create_physics_3d():
    """Create a new 3D physics setting"""
    try:
        data = request.get_json()
        
        # Get the user ID from the JWT token
        user_id = current_user.id
        
        # Create a new Physics3D instance
        physics_3d = Physics3D(
            user_id=user_id,
            gravity=data.get('gravity'),
            air_resistance=data.get('air_resistance'),
            friction=data.get('friction'),
            elasticity=data.get('elasticity'),
            universe_id=data.get('universe_id'),
            scene_id=data.get('scene_id')
        )
        
        # Add to database and commit
        db.session.add(physics_3d)
        db.session.commit()
        
        return jsonify(physics_3d.to_dict()), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@physics_bp.route('/3d/<int:id>', methods=['PUT'])
@login_required
def update_physics_3d(id):
    """Update a specific 3D physics setting"""
    try:
        physics_3d = Physics3D.query.filter_by(id=id, user_id=current_user.id).first_or_404()
        
        data = request.get_json()
        for key, value in data.items():
            if hasattr(physics_3d, key):
                setattr(physics_3d, key, value)
        
        db.session.commit()
        return jsonify(physics_3d.to_dict())
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@physics_bp.route('/3d/<int:id>', methods=['DELETE'])
@login_required
def delete_physics_3d(id):
    """Delete a specific 3D physics setting"""
    try:
        physics_3d = Physics3D.query.filter_by(id=id, user_id=current_user.id).first_or_404()
        db.session.delete(physics_3d)
        db.session.commit()
        return jsonify({'message': 'Physics 3D setting deleted successfully'})
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
@login_required
def create_physics_object():
    """Create a new physics object"""
    try:
        data = request.get_json()
        
        physics_object = PhysicsObject(
            user_id=current_user.id,
            name=data.get('name'),
            object_type=data.get('object_type'),
            mass=data.get('mass'),
            position=data.get('position'),
            rotation=data.get('rotation'),
            scale=data.get('scale'),
            is_static=data.get('is_static', False),
            universe_id=data.get('universe_id'),
            scene_id=data.get('scene_id')
        )
        
        db.session.add(physics_object)
        db.session.commit()
        
        return jsonify(physics_object.to_dict()), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@physics_bp.route('/objects/<int:id>', methods=['PUT'])
@login_required
def update_physics_object(id):
    """Update a specific physics object"""
    try:
        physics_object = PhysicsObject.query.filter_by(id=id, user_id=current_user.id).first_or_404()
        
        data = request.get_json()
        for key, value in data.items():
            if hasattr(physics_object, key):
                setattr(physics_object, key, value)
        
        db.session.commit()
        return jsonify(physics_object.to_dict())
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@physics_bp.route('/objects/<int:id>', methods=['DELETE'])
@login_required
def delete_physics_object(id):
    """Delete a specific physics object"""
    try:
        physics_object = PhysicsObject.query.filter_by(id=id, user_id=current_user.id).first_or_404()
        db.session.delete(physics_object)
        db.session.commit()
        return jsonify({'message': 'Physics object deleted successfully'})
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
@login_required
def create_physics_constraint():
    """Create a new physics constraint"""
    try:
        data = request.get_json()
        
        constraint = PhysicsConstraint(
            user_id=current_user.id,
            constraint_type=data.get('constraint_type'),
            object_a_id=data.get('object_a_id'),
            object_b_id=data.get('object_b_id'),
            parameters=data.get('parameters'),
            universe_id=data.get('universe_id'),
            scene_id=data.get('scene_id')
        )
        
        db.session.add(constraint)
        db.session.commit()
        
        return jsonify(constraint.to_dict()), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@physics_bp.route('/constraints/<int:id>', methods=['PUT'])
@login_required
def update_physics_constraint(id):
    """Update a specific physics constraint"""
    try:
        constraint = PhysicsConstraint.query.filter_by(id=id, user_id=current_user.id).first_or_404()
        
        data = request.get_json()
        for key, value in data.items():
            if hasattr(constraint, key):
                setattr(constraint, key, value)
        
        db.session.commit()
        return jsonify(constraint.to_dict())
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@physics_bp.route('/constraints/<int:id>', methods=['DELETE'])
@login_required
def delete_physics_constraint(id):
    """Delete a specific physics constraint"""
    try:
        constraint = PhysicsConstraint.query.filter_by(id=id, user_id=current_user.id).first_or_404()
        db.session.delete(constraint)
        db.session.commit()
        return jsonify({'message': 'Physics constraint deleted successfully'})
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 