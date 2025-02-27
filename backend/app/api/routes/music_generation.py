"""Music generation routes."""
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.errors import ValidationError, NotFoundError, AuthorizationError
from app.models.universe.universe import Universe
from app.models.universe.scene import Scene
from app.models.audio.audio_track import AudioTrack
from app.db.session import get_db
from uuid import UUID
import os

audio_bp = Blueprint('audio', __name__)
visualization_bp = Blueprint('visualization', __name__)
physics_bp = Blueprint('physics', __name__)
ai_bp = Blueprint('ai', __name__)

@audio_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_audio():
    """Generate audio based on parameters."""
    current_user_id = get_jwt_identity()
    data = request.json

    if not data:
        raise ValidationError("No data provided")

    required_fields = ['scene_id', 'parameters']
    for field in required_fields:
        if field not in data:
            raise ValidationError(f"Missing required field: {field}")

    try:
        scene_id = UUID(data['scene_id'])
    except ValueError:
        raise ValidationError("Invalid scene_id format")

    with get_db() as db:
        # Verify scene exists and user has access
        scene = db.query(Scene).filter_by(id=scene_id).first()
        if not scene:
            raise NotFoundError("Scene not found")

        # Create audio track
        audio_track = AudioTrack(
            name=data.get('name', 'Generated Audio'),
            scene_id=scene_id,
            universe_id=scene.universe_id,
            user_id=current_user_id,
            parameters=data['parameters']
        )

        db.add(audio_track)
        db.commit()
        db.refresh(audio_track)

        return jsonify(audio_track.to_dict()), 201

@audio_bp.route('/<audio_id>', methods=['GET'])
@jwt_required()
def get_audio(audio_id):
    """Get audio track details."""
    current_user_id = get_jwt_identity()

    try:
        UUID(audio_id)
    except ValueError:
        raise ValidationError("Invalid audio_id format")

    with get_db() as db:
        audio_track = db.query(AudioTrack).filter_by(id=audio_id).first()
        if not audio_track:
            raise NotFoundError("Audio track not found")

        # Check permissions
        if str(audio_track.user_id) != current_user_id:
            raise AuthorizationError("You don't have permission to access this audio track")

        return jsonify(audio_track.to_dict())

@audio_bp.route('/<audio_id>/file', methods=['GET'])
@jwt_required()
def get_audio_file(audio_id):
    """Get audio file."""
    current_user_id = get_jwt_identity()

    try:
        UUID(audio_id)
    except ValueError:
        raise ValidationError("Invalid audio_id format")

    with get_db() as db:
        audio_track = db.query(AudioTrack).filter_by(id=audio_id).first()
        if not audio_track:
            raise NotFoundError("Audio track not found")

        # Check permissions
        if str(audio_track.user_id) != current_user_id:
            raise AuthorizationError("You don't have permission to access this audio file")

        if not audio_track.file_path or not os.path.exists(audio_track.file_path):
            raise NotFoundError("Audio file not found")

        return send_file(audio_track.file_path)

@audio_bp.route('/<audio_id>', methods=['DELETE'])
@jwt_required()
def delete_audio(audio_id):
    """Delete audio track."""
    current_user_id = get_jwt_identity()

    try:
        UUID(audio_id)
    except ValueError:
        raise ValidationError("Invalid audio_id format")

    with get_db() as db:
        audio_track = db.query(AudioTrack).filter_by(id=audio_id).first()
        if not audio_track:
            raise NotFoundError("Audio track not found")

        # Check permissions
        if str(audio_track.user_id) != current_user_id:
            raise AuthorizationError("You don't have permission to delete this audio track")

        # Delete file if it exists
        if audio_track.file_path and os.path.exists(audio_track.file_path):
            os.remove(audio_track.file_path)

        db.delete(audio_track)
        db.commit()

        return jsonify({"message": "Audio track deleted successfully"})

@visualization_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_visualization():
    """Generate visualization based on parameters."""
    return jsonify({"message": "Not implemented yet"}), 501

@physics_bp.route('/simulate', methods=['POST'])
@jwt_required()
def simulate_physics():
    """Run physics simulation."""
    return jsonify({"message": "Not implemented yet"}), 501

@ai_bp.route('/optimize', methods=['POST'])
@jwt_required()
def optimize_parameters():
    """Optimize parameters using AI."""
    return jsonify({"message": "Not implemented yet"}), 501
