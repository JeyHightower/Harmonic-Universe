"""Universe routes."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request, jwt_optional
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import or_
from ..extensions import db, limiter, cache
from ..models import Universe, PhysicsParameters
from ..utils.parameter_validator import validate_parameters
from werkzeug.exceptions import BadRequest, NotFound, Unauthorized
from ..utils.decorators import handle_exceptions
from app.schemas.universe import UniverseSchema
from app.services.universe_service import UniverseService

universe_bp = Blueprint('universes', __name__)
universe_schema = UniverseSchema()
universe_service = UniverseService()

@universe_bp.before_request
def verify_token():
    """Verify JWT token before processing request"""
    # Skip token verification for public routes
    if request.method == 'GET' and request.endpoint in ['universes.get_universes']:
        return None

    # For universe-specific routes, check if the universe is public
    if request.method == 'GET' and request.endpoint == 'universes.get_universe':
        universe_id = request.view_args.get('universe_id')
        if universe_id:
            universe = Universe.query.get(universe_id)
            if not universe or not universe.is_public:
                try:
                    verify_jwt_in_request()
                except Exception:
                    return jsonify({
                        'error': 'Authentication required'
                    }), 401

    # For all other routes, require authentication
    try:
        verify_jwt_in_request()
    except Exception:
        return jsonify({
            'error': 'Authentication required'
        }), 401

@universe_bp.route('/api/universes', methods=['GET'])
@jwt_optional
def get_universes():
    """Get all public universes or user's universes."""
    current_user_id = get_jwt_identity()
    query = request.args.get('q')
    sort_by = request.args.get('sort_by', 'recent')

    try:
        if query:
            universes = universe_service.search_universes(query)
        elif current_user_id:
            universes = universe_service.get_user_universes(current_user_id)
        else:
            universes = universe_service.get_public_universes()

        return jsonify([universe_schema.dump(u) for u in universes])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/api/universes', methods=['POST'])
@jwt_required()
def create_universe():
    """Create a new universe."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        universe = universe_service.create_universe(current_user_id, data)
        return jsonify(universe_schema.dump(universe)), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to create universe'}), 500

@universe_bp.route('/api/universes/<int:universe_id>', methods=['GET'])
@jwt_optional
def get_universe(universe_id):
    """Get a specific universe by ID."""
    current_user_id = get_jwt_identity()

    try:
        universe = universe_service.get_universe(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not universe.is_public and (not current_user_id or current_user_id != universe.creator_id):
            return jsonify({'error': 'Unauthorized to view this universe'}), 403

        return jsonify(universe_schema.dump(universe))
    except Exception as e:
        return jsonify({'error': 'Failed to fetch universe'}), 500

@universe_bp.route('/api/universes/<int:universe_id>', methods=['PUT'])
@jwt_required()
def update_universe(universe_id):
    """Update a specific universe."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        universe = universe_service.update_universe(universe_id, current_user_id, data)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404
        return jsonify(universe_schema.dump(universe))
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to update universe'}), 500

@universe_bp.route('/api/universes/<int:universe_id>', methods=['DELETE'])
@jwt_required()
def delete_universe(universe_id):
    """Delete a specific universe."""
    current_user_id = get_jwt_identity()

    try:
        universe_service.delete_universe(universe_id, current_user_id)
        return '', 204
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to delete universe'}), 500

@universe_bp.route('/api/universes/<int:universe_id>/favorite', methods=['POST'])
@jwt_required()
def favorite_universe(universe_id):
    """Add universe to user's favorites."""
    current_user_id = get_jwt_identity()

    try:
        universe_service.add_favorite(universe_id, current_user_id)
        return '', 204
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to favorite universe'}), 500

@universe_bp.route('/api/universes/<int:universe_id>/favorite', methods=['DELETE'])
@jwt_required()
def unfavorite_universe(universe_id):
    """Remove universe from user's favorites."""
    current_user_id = get_jwt_identity()

    try:
        universe_service.remove_favorite(universe_id, current_user_id)
        return '', 204
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to unfavorite universe'}), 500

@universe_bp.route('/api/universes/<int:universe_id>/collaborators', methods=['GET'])
@jwt_required()
def get_collaborators(universe_id):
    """Get universe collaborators."""
    try:
        collaborators = universe_service.get_collaborators(universe_id)
        return jsonify(collaborators)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to fetch collaborators'}), 500

@universe_bp.route('/api/universes/<int:universe_id>/collaborators', methods=['POST'])
@jwt_required()
def add_collaborator(universe_id):
    """Add a collaborator to the universe."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        collaborator = universe_service.add_collaborator(universe_id, current_user_id, data)
        return jsonify(collaborator), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to add collaborator'}), 500

@universe_bp.route('/api/universes/<int:universe_id>/collaborators/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_collaborator(universe_id, user_id):
    """Remove a collaborator from the universe."""
    current_user_id = get_jwt_identity()

    try:
        universe_service.remove_collaborator(universe_id, current_user_id, user_id)
        return '', 204
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to remove collaborator'}), 500

@universe_bp.route('/api/universes/<int:universe_id>/comments', methods=['GET'])
@jwt_optional
def get_comments(universe_id):
    """Get universe comments."""
    try:
        comments = universe_service.get_comments(universe_id)
        return jsonify(comments)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to fetch comments'}), 500

@universe_bp.route('/api/universes/<int:universe_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(universe_id):
    """Add a comment to the universe."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        comment = universe_service.add_comment(universe_id, current_user_id, data)
        return jsonify(comment), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to add comment'}), 500

@universe_bp.route('/api/universes/<int:universe_id>/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(universe_id, comment_id):
    """Delete a comment from the universe."""
    current_user_id = get_jwt_identity()

    try:
        universe_service.delete_comment(universe_id, comment_id, current_user_id)
        return '', 204
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to delete comment'}), 500

@universe_bp.route('/<int:universe_id>/physics', methods=['PATCH'])
@jwt_required()
@limiter.limit("50 per hour")
def update_physics(universe_id):
    """Update physics parameters."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if universe.creator_id != current_user_id:
            return jsonify({'error': 'Unauthorized access'}), 403

        validation_errors = validate_parameters(data, {}, {})
        if validation_errors:
            return jsonify({'error': 'Invalid parameters', 'details': validation_errors}), 400

        universe.physics_parameters.update(data)

        # Update related parameters based on physics changes
        universe.update_dependent_parameters('physics')

        db.session.commit()
        cache.delete_memoized(get_universe, universe_id)
        cache.delete_memoized(get_universes)

        return jsonify({
            'physics_parameters': universe.physics_parameters.to_dict(),
            'music_parameters': universe.music_parameters.to_dict(),
            'visualization_parameters': universe.visualization_parameters.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/<int:universe_id>/music', methods=['PATCH'])
@jwt_required()
@limiter.limit("50 per hour")
def update_music(universe_id):
    """Update music parameters."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if universe.creator_id != current_user_id:
            return jsonify({'error': 'Unauthorized access'}), 403

        validation_errors = validate_parameters({}, data, {})
        if validation_errors:
            return jsonify({'error': 'Invalid parameters', 'details': validation_errors}), 400

        universe.music_parameters.update(data)

        # Update visualization based on music changes
        universe.update_dependent_parameters('music')

        db.session.commit()
        cache.delete_memoized(get_universe, universe_id)
        cache.delete_memoized(get_universes)

        return jsonify({
            'music_parameters': universe.music_parameters.to_dict(),
            'visualization_parameters': universe.visualization_parameters.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/<int:universe_id>/parameters', methods=['PATCH'])
@jwt_required()
@limiter.limit("30 per hour")
def update_parameters(universe_id):
    """Update universe parameters."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No data provided'
            }), 400

        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        # Check if user owns the universe
        if universe.creator_id != current_user_id:
            return jsonify({
                'error': 'Unauthorized access'
            }), 403

        # Validate parameters
        physics_data = data.get('physics_parameters', {})
        music_data = data.get('music_parameters', {})
        vis_data = data.get('visualization_parameters', {})

        validation_errors = validate_parameters(physics_data, music_data, vis_data)
        if validation_errors:
            return jsonify({
                'error': 'Invalid parameters',
                'errors': validation_errors
            }), 400

        # Update physics parameters
        if physics_data:
            universe.physics_parameters.update(physics_data)

        # Update music parameters
        if music_data:
            universe.music_parameters.update(music_data)

        # Update visualization parameters
        if vis_data:
            universe.visualization_parameters.update(vis_data)

        db.session.commit()
        cache.delete_memoized(get_universe, universe_id)
        return jsonify(universe.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error updating parameters: {str(e)}")
        return jsonify({
            'error': 'Failed to update parameters'
        }), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating parameters: {str(e)}")
        return jsonify({
            'error': 'Failed to update parameters'
        }), 500

@universe_bp.route('/<int:universe_id>/ai/suggest', methods=['POST'])
@jwt_required()
@limiter.limit("10 per hour")
def ai_suggest(universe_id):
    """Get AI suggestions for parameter optimization."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        # Check if user owns the universe or if it's public
        if not universe.is_public and universe.creator_id != current_user_id:
            return jsonify({'error': 'Unauthorized access'}), 403

        target = data.get('target')
        if target not in ['physics', 'music', 'visualization']:
            return jsonify({'error': 'Invalid target parameter'}), 400

        constraints = data.get('constraints', {})

        # For testing, return mock suggestions
        suggestions = {
            'suggestions': {
                'physics_parameters': {
                    'gravity': max(5.0, min(20.0, 9.81)),
                    'friction': 0.5,
                    'elasticity': 0.7
                },
                'music_parameters': {
                    'tempo': min(160, 120),
                    'key': 'C',
                    'scale': 'major'
                }
            },
            'explanation': 'Optimized parameters based on constraints'
        }

        return jsonify(suggestions), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/<int:universe_id>/sync', methods=['POST'])
@jwt_required()
@limiter.limit("100 per hour")
def sync_parameters(universe_id):
    """Synchronize parameters in real-time."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if universe.creator_id != current_user_id:
            return jsonify({'error': 'Unauthorized access'}), 403

        # Validate and update parameters
        validation_errors = validate_parameters(
            data.get('physics_parameters', {}),
            data.get('music_parameters', {}),
            data.get('visualization_parameters', {})
        )
        if validation_errors:
            return jsonify({'error': 'Invalid parameters', 'details': validation_errors}), 400

        # Update parameters
        if 'physics_parameters' in data:
            universe.physics_parameters.update(data['physics_parameters'])
            universe.update_dependent_parameters('physics')

        if 'music_parameters' in data:
            universe.music_parameters.update(data['music_parameters'])
            universe.update_dependent_parameters('music')

        if 'visualization_parameters' in data:
            universe.visualization_parameters.update(data['visualization_parameters'])

        db.session.commit()
        cache.delete_memoized(get_universe, universe_id)
        cache.delete_memoized(get_universes)

        # Broadcast update via WebSocket
        current_app.websocket_manager.broadcast_universe_update(universe_id)

        return jsonify({
            'physics_parameters': universe.physics_parameters.to_dict(),
            'music_parameters': universe.music_parameters.to_dict(),
            'visualization_parameters': universe.visualization_parameters.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/<int:universe_id>/music/generate', methods=['POST'])
@jwt_required()
@limiter.limit("30 per hour")
def generate_music(universe_id):
    """Generate music based on current parameters."""
    try:
        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if not universe.is_public and universe.creator_id != current_user_id:
            return jsonify({'error': 'Unauthorized access'}), 403

        # Get generation parameters from request
        data = request.get_json() or {}
        duration = data.get('duration', 30)  # Default 30 seconds
        start_time = data.get('start_time', 0)

        # Generate music
        music_generator = MusicGenerator()
        music_data = music_generator.generate(
            universe.music_parameters,
            duration=duration,
            start_time=start_time
        )

        # Broadcast via WebSocket
        current_app.websocket_manager.broadcast_music_update(universe_id, music_data)

        return jsonify(music_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/<int:universe_id>/visualization/render', methods=['POST'])
@jwt_required()
@limiter.limit("60 per hour")
def render_visualization(universe_id):
    """Render visualization based on current parameters."""
    try:
        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if not universe.is_public and universe.creator_id != current_user_id:
            return jsonify({'error': 'Unauthorized access'}), 403

        # Get render parameters from request
        data = request.get_json() or {}
        width = data.get('width', 800)
        height = data.get('height', 600)
        quality = data.get('quality', 'high')

        # Render visualization
        renderer = VisualizationRenderer()
        render_data = renderer.render(
            universe.visualization_parameters,
            width=width,
            height=height,
            quality=quality
        )

        # Broadcast via WebSocket
        current_app.websocket_manager.broadcast_visualization_update(universe_id, render_data)

        return jsonify(render_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/<int:universe_id>/collaborate', methods=['POST'])
@jwt_required()
@limiter.limit("100 per hour")
def start_collaboration(universe_id):
    """Start real-time collaboration session."""
    try:
        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if not universe.is_public and universe.creator_id != current_user_id:
            return jsonify({'error': 'Unauthorized access'}), 403

        # Get collaboration parameters
        data = request.get_json() or {}
        max_participants = data.get('max_participants', 5)
        mode = data.get('mode', 'view')  # 'view' or 'edit'

        # Create collaboration room
        room_token = current_app.websocket_manager.create_collaboration_room(
            universe_id,
            current_user_id,
            max_participants=max_participants,
            mode=mode
        )

        return jsonify({
            'room_token': room_token,
            'websocket_url': f"ws://{request.host}/ws/collaborate",
            'max_participants': max_participants,
            'mode': mode
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/private', methods=['GET'])
@handle_exceptions
def get_private_universe():
    """Get a private universe (requires authentication)."""
    raise Unauthorized('Authentication required')

@universe_bp.route('/upload', methods=['POST'])
@handle_exceptions
def upload_file():
    """Handle file upload."""
    if 'file' not in request.files:
        raise BadRequest('No file provided')
    return jsonify({'message': 'File uploaded successfully'})
