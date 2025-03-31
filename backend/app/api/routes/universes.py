from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.models.universe import Universe
from app import db

universes_bp = Blueprint('universes', __name__)

@universes_bp.route('/', methods=['GET'])
@jwt_required()
def get_universes():
    try:
        # Get query parameters
        public_only = request.args.get('public', 'false').lower() == 'true'
        user_id = get_jwt_identity()
        current_app.logger.info(f"Fetching universes for user {user_id}, public_only: {public_only}")

        # Build query
        query = Universe.query.filter_by(is_deleted=False)

        if public_only:
            query = query.filter_by(is_public=True)
        else:
            # Include user's own universes and public universes
            query = query.filter(
                (Universe.user_id == user_id) | (Universe.is_public == True)
            )

        # Execute query
        universes = query.all()
        current_app.logger.info(f"Found {len(universes)} universes")

        # Format response
        return jsonify({
            'message': 'Universes retrieved successfully',
            'universes': [universe.to_dict() for universe in universes]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving universes: {str(e)}")
        current_app.logger.error(f"Query parameters: public_only={public_only}, user_id={user_id}")
        return jsonify({
            'message': 'Error retrieving universes',
            'error': str(e)
        }), 500

@universes_bp.route('/<int:universe_id>', methods=['GET'])
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

@universes_bp.route('/', methods=['POST'])
@jwt_required()
def create_universe():
    try:
        data = request.get_json()
        if not data:
            current_app.logger.warning('Create universe attempt with no data')
            return jsonify({
                'message': 'No data provided',
                'error': 'Request body is required'
            }), 400

        user_id = get_jwt_identity()
        current_app.logger.info(f'Creating universe for user {user_id}')
        
        # Validate required fields
        name = data.get('name', '').strip()
        if not name:
            current_app.logger.warning(f'Create universe attempt with empty name by user {user_id}')
            return jsonify({
                'message': 'Name is required',
                'error': 'Universe name cannot be empty'
            }), 400
            
        if len(name) > 100:
            current_app.logger.warning(f'Create universe attempt with too long name by user {user_id}')
            return jsonify({
                'message': 'Name is too long',
                'error': 'Universe name cannot exceed 100 characters'
            }), 400

        # Create new universe with validated data
        universe = Universe(
            name=name,
            description=data.get('description', '').strip(),
            is_public=data.get('is_public', False),
            user_id=user_id
        )

        # Validate the universe object
        try:
            universe.validate()
        except ValueError as ve:
            current_app.logger.warning(f'Universe validation error for user {user_id}: {str(ve)}')
            return jsonify({
                'message': 'Validation error',
                'error': str(ve)
            }), 400

        db.session.add(universe)
        db.session.commit()
        
        current_app.logger.info(f'Universe {universe.id} created successfully for user {user_id}')
        return jsonify({
            'message': 'Universe created successfully',
            'universe': universe.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error creating universe for user {user_id}: {str(e)}')
        return jsonify({
            'message': 'Error creating universe',
            'error': str(e)
        }), 500

@universes_bp.route('/<int:universe_id>', methods=['PUT'])
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

@universes_bp.route('/<int:universe_id>', methods=['DELETE'])
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