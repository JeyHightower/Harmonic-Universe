from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.models.universe import Universe
from app import db

bp = Blueprint('universes', __name__)

@bp.route('/universes', methods=['GET'])
@jwt_required()
def get_universes():
    try:
        # Get query parameters
        public_only = request.args.get('public', 'false').lower() == 'true'
        user_id = get_jwt_identity()

        # Build query
        query = Universe.query

        if public_only:
            query = query.filter_by(is_public=True)
        else:
            # Include user's own universes and public universes
            query = query.filter(
                (Universe.user_id == user_id) | (Universe.is_public == True)
            )

        # Execute query
        universes = query.all()

        # Format response
        return jsonify({
            'message': 'Universes retrieved successfully',
            'universes': [universe.to_dict() for universe in universes]
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Error retrieving universes',
            'error': str(e)
        }), 500

@bp.route('/universes/<int:universe_id>', methods=['GET'])
@jwt_required()
def get_universe(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Check if user has access to this universe
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        return jsonify({
            'message': 'Universe retrieved successfully',
            'universe': universe.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Error retrieving universe',
            'error': str(e)
        }), 500

@bp.route('/universes', methods=['POST'])
@jwt_required()
def create_universe():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()

        # Create new universe
        universe = Universe(
            name=data.get('name', 'New Universe'),
            description=data.get('description', ''),
            is_public=data.get('is_public', False),
            user_id=user_id
        )

        db.session.add(universe)
        db.session.commit()

        return jsonify({
            'message': 'Universe created successfully',
            'universe': universe.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error creating universe',
            'error': str(e)
        }), 500

@bp.route('/universes/<int:universe_id>', methods=['PUT'])
@jwt_required()
def update_universe(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Check if user owns this universe
        if universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        data = request.get_json()

        # Update universe fields
        if 'name' in data:
            universe.name = data['name']
        if 'description' in data:
            universe.description = data['description']
        if 'is_public' in data:
            universe.is_public = data['is_public']

        db.session.commit()

        return jsonify({
            'message': 'Universe updated successfully',
            'universe': universe.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error updating universe',
            'error': str(e)
        }), 500

@bp.route('/universes/<int:universe_id>', methods=['DELETE'])
@jwt_required()
def delete_universe(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Check if user owns this universe
        if universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied'
            }), 403

        db.session.delete(universe)
        db.session.commit()

        return jsonify({
            'message': 'Universe deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Error deleting universe',
            'error': str(e)
        }), 500 