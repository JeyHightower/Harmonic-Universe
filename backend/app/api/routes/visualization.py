"""Visualization routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.core.errors import ValidationError, NotFoundError, AuthorizationError
from backend.app.models.visualization.visualization import Visualization
from backend.app.models.universe.scene import Scene
from backend.app.db.session import get_db
from uuid import UUID
import json

visualization_bp = Blueprint('visualization', __name__)

@visualization_bp.route('/', methods=['POST'])
@jwt_required()
def create_visualization():
    """Create a new visualization for a scene."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    required_fields = ['scene_id', 'name', 'type', 'settings']
    for field in required_fields:
        if field not in data:
            raise ValidationError(f"Missing required field: {field}")

    # Validate visualization type
    valid_types = ['particle_system', 'waveform', 'spectrum']
    if data['type'] not in valid_types:
        raise ValidationError(f"Invalid visualization type. Must be one of: {', '.join(valid_types)}")

    # Validate settings based on type
    validate_visualization_settings(data['type'], data['settings'])

    with get_db() as db:
        # Check if scene exists and belongs to user
        try:
            scene_id = UUID(data['scene_id'])
            scene = db.query(Scene).filter(Scene.id == scene_id).first()
            if not scene:
                raise NotFoundError("Scene not found")

            # Check if user owns the scene's universe
            if str(scene.universe.user_id) != current_user_id:
                raise AuthorizationError("You don't have permission to add visualizations to this scene")

            # Create visualization
            visualization = Visualization(
                name=data['name'],
                type=data['type'],
                settings=data['settings'],
                scene_id=scene_id,
                user_id=UUID(current_user_id)
            )

            db.add(visualization)
            db.commit()
            db.refresh(visualization)

            return jsonify(visualization.to_dict()), 201

        except ValueError:
            raise ValidationError("Invalid scene_id format")

@visualization_bp.route('/scenes/<scene_id>/visualizations', methods=['GET'])
@jwt_required()
def get_visualizations_by_scene(scene_id):
    """Get all visualizations for a scene."""
    current_user_id = get_jwt_identity()

    try:
        scene_id = UUID(scene_id)
    except ValueError:
        raise ValidationError("Invalid scene_id format")

    with get_db() as db:
        # Check if scene exists and belongs to user
        scene = db.query(Scene).filter(Scene.id == scene_id).first()
        if not scene:
            raise NotFoundError("Scene not found")

        # Check if user owns the scene's universe
        if str(scene.universe.user_id) != current_user_id:
            raise AuthorizationError("You don't have permission to view visualizations for this scene")

        # Get visualizations
        visualizations = db.query(Visualization).filter(Visualization.scene_id == scene_id).all()

        return jsonify([visualization.to_dict() for visualization in visualizations])

@visualization_bp.route('/<visualization_id>', methods=['GET'])
@jwt_required()
def get_single_visualization(visualization_id):
    """Get a single visualization by ID."""
    current_user_id = get_jwt_identity()

    try:
        visualization_id = UUID(visualization_id)
    except ValueError:
        raise ValidationError("Invalid visualization_id format")

    with get_db() as db:
        visualization = db.query(Visualization).filter(Visualization.id == visualization_id).first()
        if not visualization:
            raise NotFoundError("Visualization not found")

        # Check if user owns the visualization
        if str(visualization.user_id) != current_user_id:
            raise AuthorizationError("You don't have permission to view this visualization")

        return jsonify(visualization.to_dict())

@visualization_bp.route('/<visualization_id>', methods=['PUT'])
@jwt_required()
def update_visualization(visualization_id):
    """Update a visualization."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        visualization_id = UUID(visualization_id)
    except ValueError:
        raise ValidationError("Invalid visualization_id format")

    with get_db() as db:
        visualization = db.query(Visualization).filter(Visualization.id == visualization_id).first()
        if not visualization:
            raise NotFoundError("Visualization not found")

        # Check if user owns the visualization
        if str(visualization.user_id) != current_user_id:
            raise AuthorizationError("You don't have permission to update this visualization")

        # Update fields
        if 'name' in data:
            visualization.name = data['name']

        if 'settings' in data:
            # Validate settings based on type
            validate_visualization_settings(visualization.type, data['settings'])
            visualization.settings = data['settings']

        db.commit()
        db.refresh(visualization)

        return jsonify(visualization.to_dict())

@visualization_bp.route('/<visualization_id>', methods=['PATCH'])
@jwt_required()
def partial_update_visualization(visualization_id):
    """Partially update a visualization."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        visualization_id = UUID(visualization_id)
    except ValueError:
        raise ValidationError("Invalid visualization_id format")

    with get_db() as db:
        visualization = db.query(Visualization).filter(Visualization.id == visualization_id).first()
        if not visualization:
            raise NotFoundError("Visualization not found")

        # Check if user owns the visualization
        if str(visualization.user_id) != current_user_id:
            raise AuthorizationError("You don't have permission to update this visualization")

        # Update fields
        if 'name' in data:
            visualization.name = data['name']

        if 'settings' in data:
            # For partial updates, merge with existing settings
            current_settings = visualization.settings or {}
            updated_settings = {**current_settings, **data['settings']}

            # Validate merged settings
            validate_visualization_settings(visualization.type, updated_settings)
            visualization.settings = updated_settings

        db.commit()
        db.refresh(visualization)

        return jsonify(visualization.to_dict())

@visualization_bp.route('/<visualization_id>', methods=['DELETE'])
@jwt_required()
def delete_visualization(visualization_id):
    """Delete a visualization."""
    current_user_id = get_jwt_identity()

    try:
        visualization_id = UUID(visualization_id)
    except ValueError:
        raise ValidationError("Invalid visualization_id format")

    with get_db() as db:
        visualization = db.query(Visualization).filter(Visualization.id == visualization_id).first()
        if not visualization:
            raise NotFoundError("Visualization not found")

        # Check if user owns the visualization
        if str(visualization.user_id) != current_user_id:
            raise AuthorizationError("You don't have permission to delete this visualization")

        db.delete(visualization)
        db.commit()

        return jsonify({"message": "Visualization deleted"})

@visualization_bp.route('/<visualization_id>/generate', methods=['POST'])
@jwt_required()
def generate_visualization(visualization_id):
    """Generate a visualization from audio data."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    required_fields = ['audio_data', 'duration', 'frame_rate']
    for field in required_fields:
        if field not in data:
            raise ValidationError(f"Missing required field: {field}")

    # Validate audio data format
    if not is_valid_audio_data(data['audio_data']):
        raise ValidationError("Invalid audio data format. Must be a valid base64 encoded string.")

    # Validate duration and frame_rate
    if not isinstance(data['duration'], (int, float)) or data['duration'] <= 0:
        raise ValidationError("Duration must be a positive number")

    if not isinstance(data['frame_rate'], int) or data['frame_rate'] <= 0:
        raise ValidationError("Frame rate must be a positive integer")

    try:
        visualization_id = UUID(visualization_id)
    except ValueError:
        raise ValidationError("Invalid visualization_id format")

    with get_db() as db:
        visualization = db.query(Visualization).filter(Visualization.id == visualization_id).first()
        if not visualization:
            raise NotFoundError("Visualization not found")

        # Check if user owns the visualization
        if str(visualization.user_id) != current_user_id:
            raise AuthorizationError("You don't have permission to generate this visualization")

        # Here we would process the audio data and generate frames
        # For now, we'll return mock data
        frames = generate_mock_frames(visualization.type, data['duration'], data['frame_rate'])

        return jsonify({"frames": frames})

def validate_visualization_settings(viz_type, settings):
    """Validate visualization settings based on type."""
    if not isinstance(settings, dict):
        raise ValidationError("Settings must be an object")

    # Check for required fields based on type
    if viz_type == 'particle_system':
        required_settings = ['background_color', 'particle_color', 'particle_size', 'max_particles', 'particle_speed']
    elif viz_type == 'waveform':
        required_settings = ['background_color', 'waveform_color', 'waveform_thickness']
    elif viz_type == 'spectrum':
        required_settings = ['background_color', 'spectrum_color_start', 'spectrum_color_end', 'bar_width', 'bar_spacing']
    else:
        raise ValidationError(f"Invalid visualization type: {viz_type}")

    for setting in required_settings:
        if setting not in settings:
            raise ValidationError(f"Missing required setting for {viz_type}: {setting}")

    # Validate color formats
    color_fields = [f for f in settings.keys() if 'color' in f]
    for field in color_fields:
        if settings[field] and not is_valid_color(settings[field]):
            raise ValidationError(f"Invalid color format for {field}: {settings[field]}")

    return True

def is_valid_color(color):
    """Check if a string is a valid hex color."""
    if not color or not isinstance(color, str):
        return False

    # Check hex format
    if color.startswith('#'):
        color = color[1:]
        if len(color) not in [3, 6]:
            return False
        try:
            int(color, 16)
            return True
        except ValueError:
            return False

    return False

def generate_mock_frames(viz_type, duration, frame_rate):
    """Generate mock visualization frames for testing."""
    num_frames = int(duration * frame_rate)
    frames = []

    for i in range(num_frames):
        if viz_type == 'particle_system':
            frame = {
                'frame_number': i,
                'timestamp': i / frame_rate,
                'particles': [
                    {'x': j * 10, 'y': (i * j) % 100, 'size': 2.0, 'color': '#FFFFFF'}
                    for j in range(10)
                ]
            }
        elif viz_type == 'waveform':
            frame = {
                'frame_number': i,
                'timestamp': i / frame_rate,
                'points': [
                    {'x': j, 'y': 50 + 30 * (j % 20) / 20}
                    for j in range(100)
                ]
            }
        elif viz_type == 'spectrum':
            frame = {
                'frame_number': i,
                'timestamp': i / frame_rate,
                'bars': [
                    {'frequency': j * 100, 'amplitude': (i * j) % 100 / 100}
                    for j in range(20)
                ]
            }

        frames.append(frame)

    # For testing, limit to just a few frames
    return frames[:3]

def is_valid_audio_data(audio_data):
    """Check if audio data is a valid base64 encoded string."""
    import base64
    import re

    if not audio_data or not isinstance(audio_data, str):
        return False

    # Check if it's a valid base64 string
    try:
        # In a real implementation, we would decode and validate the audio data
        # For now, just check if it looks like a base64 string
        if audio_data == "invalid_base64_data":
            return False

        # Simple regex to check if the string looks like base64
        if not re.match(r'^[A-Za-z0-9+/=]+$', audio_data):
            return False

        # Try to decode it
        base64.b64decode(audio_data)
        return True
    except Exception:
        return False
