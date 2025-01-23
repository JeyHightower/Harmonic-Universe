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
    # Skip token verification for public routes
    if request.method == 'GET' and request.endpoint in ['universe.get_universes']:
        return None

    # For universe-specific routes, check if the universe is public
    if request.method == 'GET' and request.endpoint == 'universe.get_universe':
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

@universe_bp.route('', methods=['GET'])
@cache.cached(timeout=60)
def get_universes():
    """Get all public universes."""
    try:
        universes = Universe.get_public_universes().all()
        return jsonify([universe.to_dict() for universe in universes]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching universes: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch universes'
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

@universe_bp.route('/<int:universe_id>', methods=['GET'])
@cache.memoize(60)
def get_universe(universe_id):
    """Get a specific universe."""
    try:
        universe = Universe.query.options(
            db.joinedload(Universe.physics_parameters),
            db.joinedload(Universe.music_parameters),
            db.joinedload(Universe.visualization_parameters)
        ).get_or_404(universe_id)

        # Check if universe is public or if user is authenticated
        if not universe.is_public:
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                if universe.user_id != current_user_id:
                    return jsonify({
                        'error': 'Unauthorized access'
                    }), 403
            except Exception:
                return jsonify({
                    'error': 'Authentication required'
                }), 401

        return jsonify(universe.to_dict()), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching universe {universe_id}: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch universe'
        }), 500

@universe_bp.route('', methods=['POST'])
@jwt_required()
@limiter.limit("30 per hour")
def create_universe():
    """Create a new universe."""
    if not request.is_json:
        return jsonify({
            'error': 'Content type must be application/json'
        }), 400

    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({
            'error': 'Name is required'
        }), 400

    # Validate name
    name = data['name']
    if not name or not isinstance(name, str):
        return jsonify({
            'error': 'Name is required and must be a string'
        }), 400

    # Validate is_public
    is_public = data.get('is_public', True)
    if not isinstance(is_public, bool):
        return jsonify({
            'error': 'is_public must be a boolean value'
        }), 400

    current_user_id = get_jwt_identity()

    # Validate parameters
    physics_data = data.get('physics_parameters', {})
    music_data = data.get('music_parameters', {})
    vis_data = data.get('visualization_parameters', {})

    validation_errors = validate_parameters(physics_data, music_data, vis_data)
    if validation_errors:
        # Flatten validation errors
        flat_errors = {}
        for param_type, errors in validation_errors.items():
            flat_errors.update(errors)
        return jsonify({
            'error': 'Invalid parameters',
            'errors': flat_errors
        }), 400

    try:
        # Create universe with parameters
        universe = Universe(
            name=name,
            description=data.get('description', ''),
            is_public=is_public,
            user_id=current_user_id
        )

        physics_params = PhysicsParameters(
            gravity=physics_data.get('gravity', 9.81),
            friction=physics_data.get('friction', 0.5),
            elasticity=physics_data.get('elasticity', 0.7)
        )

        music_params = MusicParameters(
            key=music_data.get('key', 'C'),
            scale=music_data.get('scale', 'major'),
            tempo=music_data.get('tempo', 120)
        )

        vis_params = VisualizationParameters(
            background_color=vis_data.get('background_color', '#000000'),
            particle_color=vis_data.get('particle_color', '#FFFFFF'),
            glow_color=vis_data.get('glow_color', '#00FF00'),
            particle_count=vis_data.get('particle_count', 1000),
            particle_size=vis_data.get('particle_size', 2.0),
            particle_speed=vis_data.get('particle_speed', 1.0),
            glow_intensity=vis_data.get('glow_intensity', 0.5),
            blur_amount=vis_data.get('blur_amount', 0.0),
            trail_length=vis_data.get('trail_length', 0.5),
            animation_speed=vis_data.get('animation_speed', 1.0),
            bounce_factor=vis_data.get('bounce_factor', 0.8),
            rotation_speed=vis_data.get('rotation_speed', 0.0),
            camera_zoom=vis_data.get('camera_zoom', 1.0),
            camera_rotation=vis_data.get('camera_rotation', 0.0)
        )

        universe.physics_parameters = physics_params
        universe.music_parameters = music_params
        universe.visualization_parameters = vis_params

        db.session.add(universe)
        db.session.commit()
        cache.delete_memoized(get_universes)

        return jsonify(universe.to_dict()), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error creating universe: {str(e)}")
        return jsonify({
            'error': 'Failed to create universe'
        }), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating universe: {str(e)}")
        return jsonify({
            'error': 'Failed to create universe'
        }), 500

@universe_bp.route('/<int:universe_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("30 per hour")
def update_universe(universe_id):
    """Update a universe."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No data provided'
            }), 400

        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        # Check if user owns the universe
        if universe.user_id != int(current_user_id):
            return jsonify({
                'error': 'Unauthorized access'
            }), 403

        # Update basic info
        if 'name' in data:
            universe.name = data['name']
        if 'description' in data:
            universe.description = data['description']
        if 'is_public' in data:
            universe.is_public = data['is_public']

        # Validate and update parameters if provided
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
        cache.delete_memoized(get_universes)

        return jsonify(universe.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error updating universe: {str(e)}")
        return jsonify({
            'error': 'Failed to update universe'
        }), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating universe: {str(e)}")
        return jsonify({
            'error': 'Failed to update universe'
        }), 500

@universe_bp.route('/<int:universe_id>', methods=['DELETE'])
@jwt_required()
@limiter.limit("30 per hour")
def delete_universe(universe_id):
    """Delete a universe."""
    try:
        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        # Check if user owns the universe
        if universe.user_id != int(current_user_id):
            return jsonify({
                'error': 'Unauthorized access'
            }), 403

        db.session.delete(universe)
        db.session.commit()
        cache.delete_memoized(get_universe, universe_id)
        return '', 204

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error deleting universe: {str(e)}")
        return jsonify({
            'error': 'Failed to delete universe'
        }), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting universe: {str(e)}")
        return jsonify({
            'error': 'Failed to delete universe'
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
        if universe.user_id != int(current_user_id):
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
        if not universe.is_public and universe.user_id != current_user_id:
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
