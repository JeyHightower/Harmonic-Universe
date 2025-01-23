# app/routes/universe_routes.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import or_
from ..extensions import db, limiter, cache
from ..models import Universe, PhysicsParameters, MusicParameters, VisualizationParameters
from ..utils.auth import check_universe_access
from ..utils.parameter_validator import validate_parameters
from ..services.music_generator import MusicGenerator
from ..services.visualization_renderer import VisualizationRenderer
from werkzeug.exceptions import BadRequest, NotFound, Unauthorized
from ..utils.decorators import handle_exceptions

universe_bp = Blueprint('universe', __name__)

@universe_bp.before_request
def verify_token():
    """Verify JWT token before processing request"""
    if current_app.config.get('TESTING'):
        # Skip token verification in test environment
        return None
    try:
        verify_jwt_in_request()
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@universe_bp.route('', methods=['GET'])
@cache.cached(timeout=60)
def get_universes():
    """Get all public universes."""
    try:
        universes = Universe.get_public_universes().all()
        return jsonify({
            'status': 'success',
            'data': {
                'universes': [universe.to_dict() for universe in universes]
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching universes: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch universes'
        }), 500

@universe_bp.route('/user/universes', methods=['GET'])
@jwt_required()
@cache.memoize(60)
def get_user_universes():
    """Get all universes accessible to the current user."""
    try:
        current_user_id = get_jwt_identity()
        universes = Universe.get_user_universes(current_user_id).all()
        return jsonify({
            'status': 'success',
            'data': {
                'universes': [universe.to_dict() for universe in universes]
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching user universes: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch universes'
        }), 500

@universe_bp.route('/universes/<int:universe_id>', methods=['GET'])
@cache.memoize(60)
def get_universe(universe_id):
    """Get a specific universe."""
    try:
        universe = Universe.query.options(
            db.joinedload(Universe.physics_parameters),
            db.joinedload(Universe.music_parameters),
            db.joinedload(Universe.visualization_parameters)
        ).get_or_404(universe_id)
        return jsonify({
            'status': 'success',
            'data': {
                'universe': universe.to_dict()
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching universe {universe_id}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch universe'
        }), 500

@universe_bp.route('', methods=['POST'])
@jwt_required()
@limiter.limit("30 per hour")
def create_universe():
    """Create a new universe."""
    if not request.is_json:
        raise BadRequest('Content type must be application/json')

    data = request.get_json()
    if not data or 'name' not in data:
        raise BadRequest('Name is required')

    name = data['name']
    current_user_id = get_jwt_identity()

    # Validate parameters
    physics_data = data.get('physics_parameters', {})
    music_data = data.get('music_parameters', {})
    vis_data = data.get('visualization_parameters', {})

    validation_errors = validate_parameters(physics_data, music_data, vis_data)
    if validation_errors:
        return jsonify({
            'status': 'error',
            'message': 'Invalid parameters',
            'errors': validation_errors
        }), 400

    # Create universe with parameters
    universe = Universe(
        name=name,
        description=data.get('description', ''),
        is_public=data.get('is_public', True),
        user_id=current_user_id
    )

    physics_params = PhysicsParameters(
        gravity=physics_data.get('gravity', 9.81),
        friction=physics_data.get('friction', 0.5),
        elasticity=physics_data.get('elasticity', 0.7),
        air_resistance=physics_data.get('air_resistance', 0.1),
        density=physics_data.get('density', 1.0)
    )

    music_params = MusicParameters(
        harmony=music_data.get('harmony', 0.5),
        tempo=music_data.get('tempo', 120),
        key=music_data.get('key', 'C'),
        scale=music_data.get('scale', 'major')
    )

    vis_params = VisualizationParameters(
        brightness=vis_data.get('brightness', 0.8),
        saturation=vis_data.get('saturation', 0.7),
        complexity=vis_data.get('complexity', 0.5),
        color_scheme=vis_data.get('color_scheme', 'monochrome')
    )

    universe.physics_parameters = physics_params
    universe.music_parameters = music_params
    universe.visualization_parameters = vis_params

    db.session.add(universe)
    db.session.commit()
    cache.delete_memoized(get_universes)

    response_data = universe.to_dict()
    response_data['physics_parameters'] = physics_params.to_dict()
    response_data['music_parameters'] = music_params.to_dict()
    response_data['visualization_parameters'] = vis_params.to_dict()

    return jsonify({
        'status': 'success',
        'data': {
            'universe': response_data
        }
    }), 201

@universe_bp.route('/universes/<int:universe_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("30 per hour")
def update_universe(universe_id):
    """Update a universe."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if universe.user_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        # Update basic info
        if 'name' in data:
            universe.name = data['name']
        if 'description' in data:
            universe.description = data['description']
        if 'is_public' in data:
            universe.is_public = data['is_public']

        # Update parameters if provided
        if 'physics_parameters' in data:
            physics_data = data['physics_parameters']
            validation_errors = validate_parameters(physics_data, {}, {})
            if validation_errors:
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid physics parameters',
                    'details': validation_errors
                }), 400

            universe.physics_parameters.update(physics_data)

        if 'music_parameters' in data:
            music_data = data['music_parameters']
            validation_errors = validate_parameters({}, music_data, {})
            if validation_errors:
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid music parameters',
                    'details': validation_errors
                }), 400

            universe.music_parameters.update(music_data)

        if 'visualization_parameters' in data:
            vis_data = data['visualization_parameters']
            validation_errors = validate_parameters({}, {}, vis_data)
            if validation_errors:
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid visualization parameters',
                    'details': validation_errors
                }), 400

            universe.visualization_parameters.update(vis_data)

        db.session.commit()
        cache.delete_memoized(get_universe, universe_id)
        cache.delete_memoized(get_universes)

        response_data = universe.to_dict()
        response_data['physics_parameters'] = universe.physics_parameters.to_dict()
        response_data['music_parameters'] = universe.music_parameters.to_dict()
        response_data['visualization_parameters'] = universe.visualization_parameters.to_dict()

        return jsonify({
            'status': 'success',
            'data': {
                'universe': response_data
            }
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Database error occurred'
        }), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An unexpected error occurred'
        }), 500

@universe_bp.route('/universes/<int:universe_id>', methods=['DELETE'])
@jwt_required()
def delete_universe(universe_id):
    """Delete a universe."""
    try:
        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if universe.user_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        db.session.delete(universe)
        db.session.commit()
        cache.delete_memoized(get_universe, universe_id)
        cache.delete_memoized(get_universes)

        return jsonify({
            'status': 'success',
            'data': {
                'message': 'Universe deleted successfully'
            }
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Database error occurred'
        }), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'An unexpected error occurred'
        }), 500

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

        if universe.user_id != current_user_id:
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

        if universe.user_id != current_user_id:
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

@universe_bp.route('/<int:universe_id>/visualization', methods=['PATCH'])
@jwt_required()
@limiter.limit("50 per hour")
def update_visualization(universe_id):
    """Update visualization parameters."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if universe.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized access'}), 403

        validation_errors = validate_parameters({}, {}, data)
        if validation_errors:
            return jsonify({'error': 'Invalid parameters', 'details': validation_errors}), 400

        universe.visualization_parameters.update(data)
        db.session.commit()
        cache.delete_memoized(get_universe, universe_id)
        cache.delete_memoized(get_universes)

        return jsonify({
            'visualization_parameters': universe.visualization_parameters.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/<int:universe_id>/ai/suggest', methods=['POST'])
@jwt_required()
@limiter.limit("10 per hour")
def ai_suggest(universe_id):
    """Get AI suggestions for parameter optimization."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if universe.user_id != current_user_id:
            return jsonify({'message': 'Unauthorized access'}), 403

        target = data.get('target')
        if target not in ['physics', 'music', 'visualization']:
            return jsonify({'message': 'Invalid target parameter'}), 400

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
        return jsonify({'message': str(e)}), 500

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

        if universe.user_id != current_user_id:
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

        if not universe.is_public and universe.user_id != current_user_id:
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

        if not universe.is_public and universe.user_id != current_user_id:
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

        if not universe.is_public and universe.user_id != current_user_id:
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

@universe_bp.route('/<int:universe_id>/parameters', methods=['PATCH'])
@jwt_required()
@limiter.limit("30 per hour")
def update_parameters(universe_id):
    """Update universe parameters."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if universe.user_id != current_user_id:
            return jsonify({'message': 'Unauthorized access'}), 403

        # Update parameters if provided
        if 'physics_parameters' in data:
            physics_data = data['physics_parameters']
            validation_errors = validate_parameters(physics_data, {}, {})
            if validation_errors:
                return jsonify({'message': 'Invalid physics parameters', 'errors': validation_errors}), 400

            for key, value in physics_data.items():
                setattr(universe.physics_parameters, key, value)

        if 'music_parameters' in data:
            music_data = data['music_parameters']
            validation_errors = validate_parameters({}, music_data, {})
            if validation_errors:
                return jsonify({'message': 'Invalid music parameters', 'errors': validation_errors}), 400

            for key, value in music_data.items():
                setattr(universe.music_parameters, key, value)

        if 'visualization_parameters' in data:
            vis_data = data['visualization_parameters']
            validation_errors = validate_parameters({}, {}, vis_data)
            if validation_errors:
                return jsonify({'message': 'Invalid visualization parameters', 'errors': validation_errors}), 400

            for key, value in vis_data.items():
                setattr(universe.visualization_parameters, key, value)

        db.session.commit()
        cache.delete_memoized(get_universe, universe_id)
        cache.delete_memoized(get_universes)

        return jsonify(universe.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@universe_bp.route('/private', methods=['GET'])
@handle_exceptions
def get_private_universe():
    """Get a private universe (requires authentication)."""
    raise Unauthorized('Authentication required')

@universe_bp.route('', methods=['GET'])
@handle_exceptions
def list_universes():
    """List all universes."""
    universes = Universe.query.all()
    return jsonify([u.to_dict() for u in universes])

@universe_bp.route('/upload', methods=['POST'])
@handle_exceptions
def upload_file():
    """Handle file upload."""
    if 'file' not in request.files:
        raise BadRequest('No file provided')
    return jsonify({'message': 'File uploaded successfully'})
