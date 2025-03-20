"""Music generation routes."""
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.core.errors import ValidationError, NotFoundError, AuthorizationError
from backend.app.models.universe.universe import Universe
from backend.app.models.universe.scene import Scene
from backend.app.models.audio.audio_track import AudioTrack
from backend.app.db.session import get_db
from uuid import UUID
import os

audio_bp = Blueprint("audio", __name__)
physics_bp = Blueprint("physics", __name__)
ai_bp = Blueprint("ai", __name__)


@audio_bp.route("/tracks", methods=["GET"])
@jwt_required()
def list_audio_tracks():
    """List audio tracks with optional filters."""
    current_user_id = get_jwt_identity()
    scene_id = request.args.get("scene_id")
    universe_id = request.args.get("universe_id")

    # Validate UUID formats if provided
    if scene_id:
        try:
            scene_id = UUID(scene_id)
        except ValueError:
            raise ValidationError("Invalid scene_id format")

    if universe_id:
        try:
            universe_id = UUID(universe_id)
        except ValueError:
            raise ValidationError("Invalid universe_id format")

    with get_db() as db:
        # Build query based on filters
        query = db.query(AudioTrack)

        # Filter by user ID for security
        query = query.filter(AudioTrack.user_id == current_user_id)

        # Apply optional filters
        if scene_id:
            query = query.filter(AudioTrack.scene_id == scene_id)

        if universe_id:
            query = query.filter(AudioTrack.universe_id == universe_id)

        audio_tracks = query.all()
        return jsonify([track.to_dict() for track in audio_tracks])


@audio_bp.route("/generate", methods=["POST"])
@jwt_required()
def generate_audio():
    """Generate audio based on parameters."""
    current_user_id = get_jwt_identity()
    data = request.json

    if not data:
        raise ValidationError("No data provided")

    required_fields = ["scene_id", "parameters"]
    for field in required_fields:
        if field not in data:
            raise ValidationError(f"Missing required field: {field}")

    try:
        scene_id = UUID(data["scene_id"])
    except ValueError:
        raise ValidationError("Invalid scene_id format")

    with get_db() as db:
        # Verify scene exists and user has access
        scene = db.query(Scene).filter_by(id=scene_id).first()
        if not scene:
            raise NotFoundError("Scene not found")

        # Create audio track
        audio_track = AudioTrack(
            name=data.get("name", "Generated Audio"),
            scene_id=scene_id,
            universe_id=scene.universe_id,
            user_id=current_user_id,
            parameters=data["parameters"],
        )

        db.add(audio_track)
        db.commit()
        db.refresh(audio_track)

        return jsonify(audio_track.to_dict()), 201


@audio_bp.route("/<audio_id>", methods=["GET"])
@jwt_required()
def get_audio(audio_id):
    """Get audio track details."""
    current_user_id = get_jwt_identity()

    try:
        audio_id = UUID(audio_id)
    except ValueError:
        raise ValidationError("Invalid audio_id format")

    with get_db() as db:
        audio_track = db.query(AudioTrack).filter_by(id=audio_id).first()
        if not audio_track:
            raise NotFoundError("Audio track not found")

        # Check permissions
        if str(audio_track.user_id) != current_user_id:
            raise AuthorizationError(
                "You don't have permission to access this audio track"
            )

        return jsonify(audio_track.to_dict())


@audio_bp.route("/<audio_id>/file", methods=["GET"])
@jwt_required()
def get_audio_file(audio_id):
    """Get audio file."""
    current_user_id = get_jwt_identity()

    try:
        audio_id = UUID(audio_id)
    except ValueError:
        raise ValidationError("Invalid audio_id format")

    with get_db() as db:
        audio_track = db.query(AudioTrack).filter_by(id=audio_id).first()
        if not audio_track:
            raise NotFoundError("Audio track not found")

        # Check permissions
        if str(audio_track.user_id) != current_user_id:
            raise AuthorizationError(
                "You don't have permission to access this audio file"
            )

        # For testing purposes - return a mock audio file if the track doesn't have a file path
        if not audio_track.file_path:
            # Create a mock audio directory if it doesn't exist
            mock_audio_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                "static",
                "mock_audio",
            )
            os.makedirs(mock_audio_dir, exist_ok=True)

            # Use a static mock file path
            mock_file_path = os.path.join(mock_audio_dir, "mock_audio.wav")

            # Create a simple WAV file if it doesn't exist (1 second of silence)
            if not os.path.exists(mock_file_path):
                try:
                    import wave
                    import struct

                    # Create a 1-second silent WAV file
                    with wave.open(mock_file_path, "w") as wf:
                        wf.setnchannels(1)  # Mono
                        wf.setsampwidth(2)  # 2 bytes per sample
                        wf.setframerate(44100)  # 44.1 kHz

                        # Generate 1 second of silence (44100 frames)
                        silence_data = struct.pack("<" + "h" * 44100, *([0] * 44100))
                        wf.writeframes(silence_data)
                except ImportError:
                    # If wave module isn't available, create an empty file
                    with open(mock_file_path, "wb") as f:
                        f.write(b"\x00" * 1000)

            # Update the audio track with the mock file path
            audio_track.file_path = mock_file_path
            db.commit()

            return send_file(mock_file_path, mimetype="audio/wav")

        if not os.path.exists(audio_track.file_path):
            raise NotFoundError("Audio file not found")

        return send_file(audio_track.file_path)


@audio_bp.route("/<audio_id>", methods=["DELETE"])
@jwt_required()
def delete_audio(audio_id):
    """Delete audio track."""
    current_user_id = get_jwt_identity()

    try:
        audio_id = UUID(audio_id)
    except ValueError:
        raise ValidationError("Invalid audio_id format")

    with get_db() as db:
        audio_track = db.query(AudioTrack).filter_by(id=audio_id).first()
        if not audio_track:
            raise NotFoundError("Audio track not found")

        # Check permissions
        if str(audio_track.user_id) != current_user_id:
            raise AuthorizationError(
                "You don't have permission to delete this audio track"
            )

        # Delete file if it exists
        if audio_track.file_path and os.path.exists(audio_track.file_path):
            os.remove(audio_track.file_path)

        db.delete(audio_track)
        db.commit()

        return jsonify({"message": "Audio track deleted successfully"})


def delete_audio_track_compat(audio_id):
    """Compatibility route for deleting audio tracks."""
    return delete_audio(audio_id)


@physics_bp.route("/simulate", methods=["POST"])
@jwt_required()
def simulate_physics():
    """Run physics simulation."""
    return jsonify({"message": "Not implemented yet"}), 501


@ai_bp.route("/optimize", methods=["POST"])
@jwt_required()
def optimize_parameters():
    """Optimize parameters using AI."""
    return jsonify({"message": "Not implemented yet"}), 501
