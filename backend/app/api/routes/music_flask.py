"""
Flask-based implementation of the music generation API.
"""
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.db.repositories.universe import UniverseRepository
from app.db.session import get_db
from app.services.music_generator import generate_music_from_params
from app.services.ai_music_generator import generate_ai_music
from app.core.errors import NotFoundError, AuthorizationError
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
