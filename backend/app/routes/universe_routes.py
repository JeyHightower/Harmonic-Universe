# app/routes/universe_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from app.extensions import db
from app.models.universe import Universe
from app.models.physics_parameters import PhysicsParameters
from app.models.music_parameters import MusicParameters
from ..extensions import limiter
from ..utils.auth import check_universe_access

universe_bp = Blueprint('universe', __name__)

@universe_bp.route('/', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")
def create_universe():
    """Create a new universe"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        if not data or not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400

        new_universe = Universe(
            user_id=current_user_id,
            title=data['title'],
            description=data.get('description', ''),
            is_public=data.get('is_public', False)
        )

        db.session.add(new_universe)
        db.session.commit()

        return jsonify(new_universe.to_dict()), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@universe_bp.route('/public', methods=['GET'])
@limiter.limit("100 per hour")
def get_public_universes():
    """Get all public universes"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        universes = Universe.query.filter_by(is_public=True)\
            .order_by(Universe.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'universes': [universe.to_dict() for universe in universes.items],
            'total': universes.total,
            'pages': universes.pages,
            'current_page': universes.page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/<int:universe_id>', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_universe(universe_id):
    """Get a specific universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        return jsonify(universe.to_dict()), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/<int:universe_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("50 per hour")
def update_universe(universe_id):
    """Update a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id, require_ownership=True):
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        if 'title' in data:
            universe.title = data['title']
        if 'description' in data:
            universe.description = data['description']
        if 'is_public' in data:
            universe.is_public = data['is_public']

        db.session.commit()
        return jsonify(universe.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@universe_bp.route('/<int:universe_id>', methods=['DELETE'])
@jwt_required()
@limiter.limit("20 per hour")
def delete_universe(universe_id):
    """Delete a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id, require_ownership=True):
            return jsonify({'error': 'Unauthorized'}), 403

        db.session.delete(universe)
        db.session.commit()

        return jsonify({'message': 'Universe deleted successfully'}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500
