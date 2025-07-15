from flask import Blueprint, jsonify, request, current_app, url_for, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.universe import Universe, Scene
from ..models.character import Character
from ..models.note import Note
from ..models.user import User
from ...extensions import db
from sqlalchemy import text
import traceback
from functools import wraps
from ...utils.decorators import get_demo_user_email, is_valid_demo_email, jwt_required_or_demo, jwt_required_except_options

universes_bp = Blueprint('universes', __name__)

@universes_bp.route('/', methods=['GET'])
@jwt_required_or_demo
def get_universes():
    try:
        # Check if this is a demo user request
        is_demo_user = request.headers.get('X-Demo-User') == 'true'
        demo_user_email = get_demo_user_email() if is_demo_user else None
        user_id = None
        if not is_demo_user:
            user_id = get_jwt_identity()
        else:
            demo_user = User.query.filter_by(email=demo_user_email).first()
            if not demo_user:
                current_app.logger.warning(f'Demo user {demo_user_email} not found')
                return jsonify({'message': 'Demo user not found', 'error': 'Invalid demo user'}), 404
            user_id = demo_user.id

        public_only = request.args.get('public', 'false').lower() == 'true'
        user_only = request.args.get('user_only', 'false').lower() == 'true'
        current_app.logger.info(f"Fetching universes for user {user_id}, public_only: {public_only}, user_only: {user_only}, is_demo: {is_demo_user}")

        try:
            query = Universe.query.filter_by(is_deleted=False)
            if is_demo_user:
                query = query.filter_by(user_id=user_id)
            elif user_only:
                query = query.filter_by(user_id=user_id)
            elif public_only:
                query = query.filter_by(is_public=True)
            else:
                query = query.filter((Universe.user_id == user_id) | (Universe.is_public == True))
            universes = query.all()
            universe_dicts = [u.to_dict() for u in universes]
            return jsonify({'message': 'Universes retrieved successfully', 'universes': universe_dicts}), 200
        except Exception as inner_e:
            current_app.logger.error(f"Database error retrieving universes: {str(inner_e)}")
            current_app.logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({'message': 'Database error retrieving universes', 'error': str(inner_e)}), 500
    except Exception as e:
        current_app.logger.error(f"Error retrieving universes: {str(e)}")
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'message': 'Error retrieving universes', 'error': str(e)}), 500

@universes_bp.route('/<int:universe_id>', methods=['GET', 'OPTIONS'])
@universes_bp.route('/<int:universe_id>/', methods=['GET', 'OPTIONS'])
@jwt_required_or_demo
def get_universe(universe_id):
    if request.method == 'OPTIONS':
        return current_app.make_default_options_response()
    try:
        is_demo_user = request.headers.get('X-Demo-User') == 'true'
        demo_user_email = get_demo_user_email() if is_demo_user else None
        user_id = None
        if not is_demo_user:
            user_id = get_jwt_identity()
        else:
            demo_user = User.query.filter_by(email=demo_user_email).first()
            if not demo_user:
                current_app.logger.warning(f'Demo user {demo_user_email} not found')
                return jsonify({'message': 'Demo user not found', 'error': 'Invalid demo user'}), 404
            user_id = demo_user.id
        universe = Universe.query.filter_by(id=universe_id, is_deleted=False).first()
        if not universe:
            current_app.logger.warning(f'Universe {universe_id} not found or deleted')
            return jsonify({'message': 'Universe not found', 'error': 'The requested universe does not exist or has been deleted'}), 404
        universe_user_id = int(universe.user_id) if universe.user_id is not None else None
        if is_demo_user:
            if user_id == universe_user_id:
                return jsonify({'message': 'Universe retrieved successfully', 'universe': universe.to_dict()}), 200
            else:
                return jsonify({'message': 'Access denied', 'error': 'You do not have permission to access this universe'}), 403
        jwt_user_id = int(user_id) if user_id is not None else None
        if not universe.is_public and universe_user_id != jwt_user_id:
            return jsonify({'message': 'Access denied', 'error': 'You do not have permission to access this universe'}), 403
        return jsonify({'message': 'Universe retrieved successfully', 'universe': universe.to_dict()}), 200
    except Exception as e:
        current_app.logger.error(f'Error retrieving universe {universe_id}: {str(e)}')
        return jsonify({'message': 'Error retrieving universe', 'error': str(e)}), 500

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
@universes_bp.route('/<int:universe_id>/', methods=['PUT'])
@jwt_required_or_demo
def update_universe(universe_id):
    try:
        # Get universe record
        universe = Universe.query.get_or_404(universe_id)

        # Check if this is a demo user request
        is_demo_user = request.headers.get('X-Demo-User') == 'true'
        demo_user_email = get_demo_user_email() if is_demo_user else None

        # Get user identity from JWT (for regular users)
        user_id = None
        if not is_demo_user:
            user_id = get_jwt_identity()

        # Always convert both IDs to integers for consistent comparison
        try:
            # Ensure both user IDs are treated as integers for comparison
            if is_demo_user:
                # For demo users, get the demo user ID
                demo_user = User.query.filter_by(email=demo_user_email).first()
                if not demo_user:
                    current_app.logger.warning(f'Demo user {demo_user_email} not found')
                    return jsonify({
                        'message': 'Demo user not found',
                        'error': 'Invalid demo user'
                    }), 404
                jwt_user_id = demo_user.id
            else:
                jwt_user_id = int(user_id) if user_id is not None else None

            universe_user_id = int(universe.user_id) if universe.user_id is not None else None

            current_app.logger.info(f"UPDATE UNIVERSE: {'Demo' if is_demo_user else 'Regular'} user_id={jwt_user_id} (type {type(jwt_user_id)}), Universe user_id={universe_user_id} (type {type(universe_user_id)})")

            # Simple integer comparison
            if jwt_user_id != universe_user_id:
                current_app.logger.warning(f"Access denied: {'Demo' if is_demo_user else 'Regular'} user {jwt_user_id} attempted to update universe {universe_id} owned by {universe_user_id}")
                return jsonify({
                    'message': 'Access denied',
                    'error': 'You do not have permission to update this universe'
                }), 403

            # User is authorized to update the universe
            data = request.get_json()
            current_app.logger.info(f"Update data: {data}")

            # Update universe fields
            if 'name' in data:
                universe.name = data['name']
            if 'description' in data:
                universe.description = data['description']
            if 'is_public' in data:
                universe.is_public = data['is_public']
            if 'genre' in data:
                universe.genre = data['genre']
            if 'theme' in data:
                universe.theme = data['theme']

            db.session.commit()
            current_app.logger.info(f"Universe {universe_id} updated successfully")

            return jsonify({
                'message': 'Universe updated successfully',
                'universe': universe.to_dict()
            }), 200

        except ValueError as e:
            current_app.logger.error(f"Type conversion error: {str(e)}")
            return jsonify({
                'message': 'Access denied due to ID type mismatch',
                'error': str(e)
            }), 403

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating universe {universe_id}: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error updating universe',
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@universes_bp.route('/<int:universe_id>', methods=['DELETE'])
@universes_bp.route('/<int:universe_id>/', methods=['DELETE'])
@jwt_required_or_demo
def delete_universe(universe_id):
    """Redirect to the primary delete implementation in universes/delete_routes.py.

    This maintains a single source of truth for the delete operation.
    """
    try:
        current_app.logger.info(f"Redirecting delete request for universe {universe_id} to the primary delete endpoint")

        # Import and use the primary implementation
        from .universes.delete_routes import delete_universe as primary_delete_universe

        # Call the implementation from delete_routes.py
        return primary_delete_universe(universe_id)

    except Exception as e:
        current_app.logger.error(f"Error redirecting delete request for universe {universe_id}: {str(e)}")
        current_app.logger.error(traceback.format_exc())

        return jsonify({
            'message': 'Error processing delete request',
            'error': str(e)
        }), 500

@universes_bp.route('/<int:universe_id>/characters', methods=['GET'])
@universes_bp.route('/<int:universe_id>/characters/', methods=['GET'])
@jwt_required()
def get_universe_characters(universe_id):
    """Get all characters in a universe"""
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Check access permissions
        if not universe.is_public and universe.user_id != user_id:
            return jsonify({
                'message': 'Access denied',
                'error': 'You do not have permission to access this universe'
            }), 403

        # Get characters for the universe
        characters = Character.query.filter_by(
            universe_id=universe_id,
            is_deleted=False
        ).all()

        return jsonify({
            'message': 'Characters retrieved successfully',
            'characters': [char.to_dict() for char in characters]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving characters for universe {universe_id}: {str(e)}")
        return jsonify({
            'message': 'Error retrieving characters',
            'error': str(e)
        }), 500

@universes_bp.route('/<int:universe_id>/scenes', methods=['GET'])
@universes_bp.route('/<int:universe_id>/scenes/', methods=['GET'])
@jwt_required()
def get_universe_scenes(universe_id):
    """
    Get scenes for a universe.

    This endpoint redirects to the primary scenes endpoint to maintain a single source of truth.
    For new code, use /api/scenes/universe/<universe_id> instead.
    """
    try:
        current_app.logger.info(f"Redirecting scenes request for universe {universe_id} to the primary scenes endpoint")

        # Redirect internally to the scenes endpoint
        from .scenes import get_scenes

        # Call the primary endpoint directly
        return get_scenes(universe_id)

    except Exception as e:
        current_app.logger.error(f"Error redirecting scenes request for universe {universe_id}: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error retrieving scenes',
            'error': str(e)
        }), 500

@universes_bp.route('/<int:universe_id>/notes', methods=['GET'])
@universes_bp.route('/<int:universe_id>/notes/', methods=['GET'])
@jwt_required()
def get_universe_notes_route(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Convert user_id and universe.user_id to integers for consistent comparison
        try:
            # Ensure both user IDs are treated as integers for comparison
            jwt_user_id = int(user_id) if user_id is not None else None
            universe_user_id = int(universe.user_id) if universe.user_id is not None else None

            # Check if user has access to this universe
            if not universe.is_public and universe_user_id != jwt_user_id:
                current_app.logger.warning(f'User {jwt_user_id} denied access to notes for universe {universe_id}')
                return jsonify({
                    'message': 'Access denied',
                    'error': 'You do not have permission to access this universe'
                }), 403

            # Get all notes for the universe
            notes = Note.query.filter_by(
                universe_id=universe_id,
                is_deleted=False
            ).all()

            return jsonify({
                'message': 'Notes retrieved successfully',
                'notes': [note.to_dict() for note in notes]
            }), 200

        except ValueError as e:
            current_app.logger.error(f"Type conversion error during access check: {str(e)}")
            return jsonify({
                'message': 'Access denied due to ID type mismatch',
                'error': str(e)
            }), 403

    except Exception as e:
        current_app.logger.error(f"Error retrieving notes for universe {universe_id}: {str(e)}")
        return jsonify({
            'message': 'Error retrieving notes',
            'error': str(e)
        }), 500

@universes_bp.route('/<int:universe_id>/repair', methods=['POST'])
@universes_bp.route('/<int:universe_id>/repair/', methods=['POST'])
@jwt_required()
def repair_universe(universe_id):
    """Special endpoint to repair database issues with a universe."""
    try:
        # Get user ID from token
        user_id = get_jwt_identity()

        # Get universe and check ownership
        universe = Universe.query.get_or_404(universe_id)

        # Convert user_id and universe.user_id to integers for consistent comparison
        try:
            # Ensure both user IDs are treated as integers for comparison
            jwt_user_id = int(user_id) if user_id is not None else None
            universe_user_id = int(universe.user_id) if universe.user_id is not None else None

            # Only the owner or admin can repair a universe
            if universe_user_id != jwt_user_id:
                current_app.logger.warning(f"Access denied: User {jwt_user_id} attempted to repair universe {universe_id} owned by {universe_user_id}")
                return jsonify({
                    'message': 'Access denied - only the owner can repair a universe',
                    'error': 'You do not have permission to repair this universe'
                }), 403

            # Run the repair method - use class method correctly
            result = Universe.repair_universe(universe_id)

            if result['success']:
                # Log success
                current_app.logger.info(f"Universe {universe_id} repaired: {result}")
                return jsonify({
                    'message': f"Universe {universe_id} repaired successfully",
                    'details': result
                }), 200
            else:
                # Log failure
                current_app.logger.error(f"Failed to repair universe {universe_id}: {result}")
                return jsonify({
                    'message': f"Failed to repair universe {universe_id}",
                    'error': result['message']
                }), 500

        except ValueError as e:
            current_app.logger.error(f"Type conversion error during repair: {str(e)}")
            return jsonify({
                'message': 'Access denied due to ID type mismatch',
                'error': str(e)
            }), 403

    except Exception as e:
        current_app.logger.error(f"Error repairing universe {universe_id}: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error repairing universe',
            'error': str(e)
        }), 500

# Debug endpoint to verify JWT identity
@universes_bp.route('/debug/jwt-identity', methods=['GET'])
@jwt_required()
def debug_jwt_identity():
    # Get JWT identity
    user_id = get_jwt_identity()

    # Get user details
    try:
        from ..models.user import User
        user = User.query.get(user_id)
        user_data = user.to_dict() if user else None
    except Exception as e:
        user_data = {"error": str(e)}

    # Return debug info
    return jsonify({
        'jwt_identity': user_id,
        'identity_type': type(user_id).__name__,
        'user_data': user_data
    }), 200


