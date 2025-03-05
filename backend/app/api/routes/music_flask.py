"""
Flask-based implementation of the music generation API.
"""
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.db.repositories.universe import UniverseRepository
from backend.app.db.session import get_db
from backend.app.services.music_generator import generate_music_from_params
from backend.app.services.ai_music_generator import generate_ai_music
from backend.app.core.errors import NotFoundError, AuthorizationError
import logging
import io
import numpy as np
from pydub import AudioSegment
from pydub.generators import Sine

# Initialize logger
logger = logging.getLogger(__name__)

# Create blueprint
music_bp = Blueprint('music', __name__)

@music_bp.route('/<universe_id>/generate', methods=['GET'])
@jwt_required()
def generate_music(universe_id):
    """
    Generate music based on the harmony and physics parameters of a universe.
    Optionally accepts custom parameters to override universe settings.

    Query Parameters:
        custom_params: JSON object containing custom music parameters

    Returns notes, tempo, and other musical elements.
    """
    try:
        # Get current user from JWT
        current_user_id = get_jwt_identity()

        # Use the get_db context manager to get a session
        with get_db() as db_session:
            # Get universe repository
            universe_repo = UniverseRepository(db_session)

            # Get universe to access harmony parameters
            universe = universe_repo.get_universe_by_id(universe_id)

            if not universe:
                raise NotFoundError(f"Universe with id {universe_id} not found")

            # Check if user has access to this universe
            if universe.user_id != current_user_id and not universe.is_public:
                raise AuthorizationError("You don't have access to this universe")

            # Get the base harmony and physics parameters from the universe
            harmony_params = universe.harmony_params
            physics_params = universe.physics_params

            # Check for custom parameters in the request
            custom_params = request.args.get('custom_params')
            if custom_params:
                try:
                    import json
                    custom_params = json.loads(custom_params)
                    logger.info(f"Using custom parameters: {custom_params}")

                    # Override harmony parameters with custom values
                    if 'tempo' in custom_params:
                        harmony_params['tempo'] = {"value": custom_params['tempo']}
                    if 'scale_type' in custom_params:
                        harmony_params['scale_type'] = {"value": custom_params['scale_type']}
                    if 'root_note' in custom_params:
                        harmony_params['root_note'] = {"value": custom_params['root_note']}

                    # Add melody complexity parameter if provided
                    if 'melody_complexity' in custom_params:
                        harmony_params['melody_complexity'] = {"value": custom_params['melody_complexity']}
                except Exception as e:
                    logger.error(f"Error parsing custom parameters: {str(e)}")
                    # Continue with default parameters on error

            # Generate music using the harmony and physics parameters
            music_data = generate_music_from_params(
                harmony_params=harmony_params,
                physics_params=physics_params
            )

            # Return the generated music data
            return jsonify({
                "universe_id": str(universe.id),
                "music_data": music_data
            })

    except NotFoundError as e:
        logger.error(f"Not found error: {str(e)}")
        return jsonify({"error": str(e)}), 404
    except AuthorizationError as e:
        logger.error(f"Authorization error: {str(e)}")
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        logger.error(f"Unexpected error in music generation: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@music_bp.route('/<universe_id>/download', methods=['GET'])
@jwt_required()
def download_music(universe_id):
    """
    Generate and download music based on the harmony and physics parameters of a universe.
    Returns an audio file (WAV format).
    """
    try:
        # Get current user from JWT
        current_user_id = get_jwt_identity()

        # Use the get_db context manager to get a session
        with get_db() as db_session:
            # Get universe repository
            universe_repo = UniverseRepository(db_session)

            # Get universe to access harmony parameters
            universe = universe_repo.get_universe_by_id(universe_id)

            if not universe:
                raise NotFoundError(f"Universe with id {universe_id} not found")

            # Check if user has access to this universe
            if universe.user_id != current_user_id and not universe.is_public:
                raise AuthorizationError("You don't have access to this universe")

            # Generate music using the harmony and physics parameters
            music_data = generate_music_from_params(
                harmony_params=universe.harmony_params,
                physics_params=universe.physics_params
            )

            # Convert the music data to an audio file
            audio_data = create_audio_from_music_data(music_data)

            # Create an in-memory file
            audio_buffer = io.BytesIO()
            audio_data.export(audio_buffer, format="wav")
            audio_buffer.seek(0)

            # Return the audio file
            return send_file(
                audio_buffer,
                mimetype="audio/wav",
                as_attachment=True,
                download_name=f"universe_{universe_id}_music.wav"
            )

    except NotFoundError as e:
        logger.error(f"Not found error: {str(e)}")
        return jsonify({"error": str(e)}), 404
    except AuthorizationError as e:
        logger.error(f"Authorization error: {str(e)}")
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        logger.error(f"Unexpected error in music download: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

def create_audio_from_music_data(music_data):
    """
    Convert music data to an audio file using pydub.

    Args:
        music_data: Dictionary containing musical elements

    Returns:
        AudioSegment object containing the generated music
    """
    # Extract music parameters
    tempo = music_data["tempo"]
    melody = music_data["melody"]

    # Calculate beat duration in milliseconds
    beat_duration = 60000 / tempo  # milliseconds per beat

    # Start with empty audio
    audio = AudioSegment.silent(duration=0)

    # MIDI note to frequency conversion
    def midi_to_freq(midi_note):
        return 440 * (2 ** ((midi_note - 69) / 12))

    # Generate audio for each note in the melody
    for note in melody:
        note_value = note["note"]
        duration = note["duration"]

        # Convert note duration to milliseconds
        note_duration_ms = int(beat_duration * duration)

        # Generate a sine wave for the note
        frequency = midi_to_freq(note_value)
        sine_generator = Sine(frequency)
        note_audio = sine_generator.to_audio_segment(duration=note_duration_ms)

        # Apply fade in/out to avoid clicks
        note_audio = note_audio.fade_in(20).fade_out(20)

        # Adjust volume
        note_audio = note_audio - 6  # -6 dB

        # Append to the audio
        audio += note_audio

    return audio

@music_bp.route('/<universe_id>/generate-ai', methods=['GET'])
@jwt_required()
def generate_ai_music_endpoint(universe_id):
    """
    Generate music with AI assistance based on the harmony and physics parameters of a universe.

    Query Parameters:
        ai_style: The style of music to generate (default, ambient, classical, electronic, jazz)
        custom_params: JSON object containing custom music parameters

    Returns notes, tempo, and other musical elements with AI enhancements.
    """
    try:
        # Get current user from JWT
        current_user_id = get_jwt_identity()

        # Get AI style from query params (default if not specified)
        ai_style = request.args.get('ai_style', 'default')

        # Validate AI style
        valid_styles = ['default', 'ambient', 'classical', 'electronic', 'jazz']
        if ai_style not in valid_styles:
            logger.warning(f"Invalid AI style requested: {ai_style}. Using default.")
            ai_style = 'default'

        # Use the get_db context manager to get a session
        with get_db() as db_session:
            # Get universe repository
            universe_repo = UniverseRepository(db_session)

            # Get universe to access harmony parameters
            universe = universe_repo.get_universe_by_id(universe_id)

            if not universe:
                raise NotFoundError(f"Universe with id {universe_id} not found")

            # Check if user has access to this universe
            if universe.user_id != current_user_id and not universe.is_public:
                raise AuthorizationError("You don't have access to this universe")

            # Get the base harmony and physics parameters from the universe
            harmony_params = universe.harmony_params
            physics_params = universe.physics_params

            # Check for custom parameters in the request
            custom_params = request.args.get('custom_params')
            if custom_params:
                try:
                    import json
                    custom_params = json.loads(custom_params)
                    logger.info(f"Using custom parameters with AI style {ai_style}: {custom_params}")

                    # Override harmony parameters with custom values
                    if 'tempo' in custom_params:
                        harmony_params['tempo'] = {"value": custom_params['tempo']}
                    if 'scale_type' in custom_params:
                        harmony_params['scale_type'] = {"value": custom_params['scale_type']}
                    if 'root_note' in custom_params:
                        harmony_params['root_note'] = {"value": custom_params['root_note']}

                    # Add melody complexity parameter if provided
                    if 'melody_complexity' in custom_params:
                        harmony_params['melody_complexity'] = {"value": custom_params['melody_complexity']}
                except Exception as e:
                    logger.error(f"Error parsing custom parameters: {str(e)}")
                    # Continue with default parameters on error

            # Generate music using the AI music generator
            music_data = generate_ai_music(
                harmony_params=harmony_params,
                physics_params=physics_params,
                ai_style=ai_style
            )

            # Return the generated music data
            return jsonify({
                "universe_id": str(universe.id),
                "music_data": music_data,
                "ai_style": ai_style
            })

    except NotFoundError as e:
        logger.error(f"Not found error: {str(e)}")
        return jsonify({"error": str(e)}), 404
    except AuthorizationError as e:
        logger.error(f"Authorization error: {str(e)}")
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        logger.error(f"Unexpected error in AI music generation: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@music_bp.route('/tracks', methods=['GET'])
@jwt_required()
def get_audio_tracks():
    """Get audio tracks with optional filtering by universe or scene."""
    try:
        # Get current user from JWT
        current_user_id = get_jwt_identity()

        # Get optional query parameters
        universe_id = request.args.get('universe_id')
        scene_id = request.args.get('scene_id')

        with get_db() as db:
            # Start with a base query
            from backend.app.models.audio.audio_track import AudioTrack
            query = db.query(AudioTrack)

            # Add filters based on provided parameters
            query = query.filter(AudioTrack.user_id == current_user_id)

            if universe_id:
                query = query.filter(AudioTrack.universe_id == universe_id)

            if scene_id:
                query = query.filter(AudioTrack.scene_id == scene_id)

            # Execute query and return results
            tracks = query.all()
            return jsonify([track.to_dict() for track in tracks])

    except Exception as e:
        logger.error(f"Error getting audio tracks: {str(e)}")
        return jsonify({"error": str(e)}), 500

@music_bp.route('/tracks', methods=['POST'])
@jwt_required()
def create_audio_track():
    """Create a new audio track."""
    try:
        # Get current user from JWT
        current_user_id = get_jwt_identity()

        # Get request data
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Validate required fields
        required_fields = ['name', 'scene_id']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        scene_id = data['scene_id']

        with get_db() as db:
            # Verify scene exists
            from backend.app.models.universe.scene import Scene
            scene = db.query(Scene).filter_by(id=scene_id).first()
            if not scene:
                return jsonify({"error": "Scene not found"}), 404

            # Create new audio track
            from backend.app.models.audio.audio_track import AudioTrack
            new_track = AudioTrack(
                name=data['name'],
                scene_id=scene_id,
                universe_id=scene.universe_id,
                user_id=current_user_id,
                parameters=data.get('parameters', {}),
                duration=data.get('duration', 0.0)
            )

            db.add(new_track)
            db.commit()
            db.refresh(new_track)

            return jsonify(new_track.to_dict()), 201

    except Exception as e:
        logger.error(f"Error creating audio track: {str(e)}")
        return jsonify({"error": str(e)}), 500

@music_bp.route('/tracks/<track_id>', methods=['GET'])
@jwt_required()
def get_single_audio_track(track_id):
    """Get a single audio track by ID."""
    try:
        # Get current user from JWT
        current_user_id = get_jwt_identity()

        with get_db() as db:
            # Get the track
            from backend.app.models.audio.audio_track import AudioTrack
            track = db.query(AudioTrack).filter_by(id=track_id).first()

            if not track:
                return jsonify({"error": "Audio track not found"}), 404

            # Check permissions
            if str(track.user_id) != current_user_id:
                return jsonify({"error": "You don't have permission to access this track"}), 403

            return jsonify(track.to_dict())

    except Exception as e:
        logger.error(f"Error getting audio track: {str(e)}")
        return jsonify({"error": str(e)}), 500

@music_bp.route('/tracks/<track_id>', methods=['PUT'])
@jwt_required()
def update_audio_track(track_id):
    """Update an existing audio track."""
    try:
        # Get current user from JWT
        current_user_id = get_jwt_identity()

        # Get request data
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        with get_db() as db:
            # Get the track
            from backend.app.models.audio.audio_track import AudioTrack
            track = db.query(AudioTrack).filter_by(id=track_id).first()

            if not track:
                return jsonify({"error": "Audio track not found"}), 404

            # Check permissions
            if str(track.user_id) != current_user_id:
                return jsonify({"error": "You don't have permission to update this track"}), 403

            # Update allowed fields
            if 'name' in data:
                track.name = data['name']

            if 'parameters' in data:
                track.parameters = data['parameters']

            if 'duration' in data:
                track.duration = data['duration']

            db.commit()
            db.refresh(track)

            return jsonify(track.to_dict())

    except Exception as e:
        logger.error(f"Error updating audio track: {str(e)}")
        return jsonify({"error": str(e)}), 500

@music_bp.route('/tracks/<track_id>', methods=['DELETE'])
@jwt_required()
def delete_audio_track(track_id):
    """Delete an audio track."""
    try:
        # Get current user from JWT
        current_user_id = get_jwt_identity()

        with get_db() as db:
            # Get the track
            from backend.app.models.audio.audio_track import AudioTrack
            track = db.query(AudioTrack).filter_by(id=track_id).first()

            if not track:
                return jsonify({"error": "Audio track not found"}), 404

            # Check permissions
            if str(track.user_id) != current_user_id:
                return jsonify({"error": "You don't have permission to delete this track"}), 403

            # Delete the track
            db.delete(track)
            db.commit()

            return jsonify({"message": "Audio track deleted successfully"})

    except Exception as e:
        logger.error(f"Error deleting audio track: {str(e)}")
        return jsonify({"error": str(e)}), 500

@music_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_audio_from_parameters():
    """Generate audio based on provided parameters."""
    try:
        # Get current user from JWT
        current_user_id = get_jwt_identity()

        # Get request data
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Validate required fields
        required_fields = ['scene_id', 'parameters']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        scene_id = data['scene_id']

        with get_db() as db:
            # Verify scene exists
            from backend.app.models.universe.scene import Scene
            scene = db.query(Scene).filter_by(id=scene_id).first()
            if not scene:
                return jsonify({"error": "Scene not found"}), 404

            # Generate music using the provided parameters
            generated_music = generate_music_from_params(
                harmony_params=data['parameters'],
                physics_params=scene.physics_overrides or {}
            )

            # Create a new audio track with the generated music
            from backend.app.models.audio.audio_track import AudioTrack
            duration = data.get('duration', 30.0)  # Default 30 seconds

            new_track = AudioTrack(
                name=data.get('name', 'Generated Track'),
                scene_id=scene_id,
                universe_id=scene.universe_id,
                user_id=current_user_id,
                parameters=data['parameters'],
                duration=duration
            )

            db.add(new_track)
            db.commit()
            db.refresh(new_track)

            # Return the track information along with the generated music data
            response = new_track.to_dict()
            response["music_data"] = generated_music

            return jsonify(response), 201

    except Exception as e:
        logger.error(f"Error generating audio: {str(e)}")
        return jsonify({"error": str(e)}), 500

@music_bp.route('/physics-to-audio', methods=['POST'])
@jwt_required()
def process_physics_to_audio():
    """Process physics parameters to generate audio."""
    try:
        # Get current user from JWT
        current_user_id = get_jwt_identity()

        # Get request data
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Validate required fields
        required_fields = ['scene_id', 'physics_parameters']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        scene_id = data['scene_id']
        physics_parameters = data['physics_parameters']
        harmony_parameters = data.get('harmony_parameters', {})

        with get_db() as db:
            # Verify scene exists
            from backend.app.models.universe.scene import Scene
            scene = db.query(Scene).filter_by(id=scene_id).first()
            if not scene:
                return jsonify({"error": "Scene not found"}), 404

            # Generate music using physics and harmony parameters
            generated_music = generate_music_from_params(
                harmony_params=harmony_parameters,
                physics_params=physics_parameters
            )

            # Create a new audio track with the generated music
            from backend.app.models.audio.audio_track import AudioTrack
            duration = data.get('duration', 30.0)  # Default 30 seconds

            new_track = AudioTrack(
                name=data.get('name', 'Physics-Generated Track'),
                scene_id=scene_id,
                universe_id=scene.universe_id,
                user_id=current_user_id,
                parameters={
                    "harmony_parameters": harmony_parameters,
                    "physics_parameters": physics_parameters
                },
                duration=duration
            )

            db.add(new_track)
            db.commit()
            db.refresh(new_track)

            # Return the track information along with the generated music data
            response = new_track.to_dict()
            response["music_data"] = generated_music

            return jsonify(response), 201

    except Exception as e:
        logger.error(f"Error processing physics to audio: {str(e)}")
        return jsonify({"error": str(e)}), 500

