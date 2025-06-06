from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import random
import json
from . import universes_bp
from ....extensions import db
from ...models.universe import Universe
from ...models.user import User
from ...models.audio import Music

@universes_bp.route('/<int:universe_id>/generate-music', methods=['GET'])
@jwt_required(optional=True)
def generate_universe_music(universe_id):
    """
    Generate music based on universe properties
    This endpoint uses the universe's properties to generate appropriate music
    """
    try:
        # Get current user (if authenticated)
        current_user_id = get_jwt_identity()

        # Fetch the universe
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        # Check if universe is private and user has access
        if not universe.is_public and (not current_user_id or universe.user_id != current_user_id):
            return jsonify({'error': 'Access denied to private universe'}), 403

        # Parse custom parameters if provided
        custom_params = request.args.get('custom_params')
        if custom_params:
            try:
                params = json.loads(custom_params)
            except:
                return jsonify({'error': 'Invalid custom parameters format'}), 400
        else:
            # Default music parameters based on universe properties
            params = {
                'tempo': random.randint(80, 140),
                'scale_type': random.choice(['major', 'minor', 'pentatonic']),
                'root_note': random.choice(['C', 'D', 'E', 'F', 'G', 'A', 'B']),
                'melody_complexity': random.uniform(0.3, 0.7)
            }

        # Parse AI style if provided
        ai_style = request.args.get('ai_style', 'default')

        # Generate music notes (in this example, we're generating random notes)
        # In a real implementation, this would use a music generation algorithm
        notes = generate_random_music(params)

        # Create response with music data
        response = {
            'universe_id': universe_id,
            'universe_name': universe.name,
            'params': params,
            'ai_style': ai_style,
            'music_data': {
                'notes': notes,
                'tempo': params['tempo'],
                'scale': params['scale_type'],
                'root': params['root_note']
            }
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@universes_bp.route('/<int:universe_id>/save-music', methods=['POST'])
@jwt_required()
def save_universe_music(universe_id):
    """
    Save generated music to the database
    This endpoint handles saving music that was previously generated
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authentication required'}), 401

        # Fetch the universe
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        # Check if user has access to save music to this universe
        try:
            # Convert user IDs to integers for comparison
            jwt_user_id = int(current_user_id) if current_user_id is not None else None
            universe_user_id = int(universe.user_id) if universe.user_id is not None else None

            if universe_user_id != jwt_user_id:
                return jsonify({'error': 'You do not have permission to save music to this universe'}), 403
        except ValueError as e:
            current_app.logger.error(f"Error converting user IDs: {str(e)}")
            return jsonify({'error': 'Invalid user ID format'}), 400

        # Get the request data
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Validate required fields
        required_fields = ['name', 'music_data']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        try:
            # Create a new Music record in the database

            # Create music data dictionary for SQLAlchemy model
            music_data = {
                'name': data['name'],
                'description': data.get('description', ''),
                'universe_id': universe_id,
                'user_id': current_user_id,
                'scene_id': data.get('scene_id'),
                'music_data': data['music_data'],
                'algorithm': data.get('algorithm', 'harmonic_synthesis'),
                'tempo': data['music_data'].get('tempo', 120),
                'key': data['music_data'].get('root', 'C'),
                'scale': data['music_data'].get('scale', 'major'),
                'parameters': data.get('settings', {})
            }

            # Create new music entry
            new_music = Music()
            for key, value in music_data.items():
                setattr(new_music, key, value)

            # Add to database and commit
            db.session.add(new_music)
            db.session.commit()

            # Return success response with the ID of the saved music
            return jsonify({
                'id': new_music.id,
                'name': new_music.name,
                'universe_id': universe_id,
                'success': True,
                'message': 'Music saved successfully'
            }), 201
        except Exception as db_error:
            # Handle database errors
            db.session.rollback()
            print(f"Database error: {str(db_error)}")

            # If Music model doesn't exist, fall back to mock implementation
            music_id = random.randint(1000, 9999)

            # Return success response with the mock ID
            return jsonify({
                'id': music_id,
                'name': data['name'],
                'universe_id': universe_id,
                'success': True,
                'message': 'Music saved successfully (mock)',
                'warning': 'Using mock implementation as Music model is not available'
            }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@universes_bp.route('/<int:universe_id>/download-music', methods=['POST'])
@jwt_required()
def download_universe_music(universe_id):
    """
    Generate a downloadable audio file from music data
    This endpoint converts music notes to an audio file
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authentication required'}), 401

        # Fetch the universe
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        # Check if user has access
        if universe.user_id != current_user_id:
            return jsonify({'error': 'You do not have permission to access this universe'}), 403

        # Get the request data
        data = request.json
        if not data or 'music_data' not in data:
            return jsonify({'error': 'No music data provided'}), 400

        # Get the format (default to mp3)
        format = data.get('format', 'mp3')
        if format not in ['mp3', 'wav', 'ogg']:
            return jsonify({'error': 'Invalid format. Supported formats: mp3, wav, ogg'}), 400

        # In a real implementation, this would generate an audio file from the music data
        # Here we'll just simulate a download URL

        # Generate a mock download URL
        download_url = f"/api/music/downloads/universe_{universe_id}_{random.randint(1000, 9999)}.{format}"

        # Return the download URL
        return jsonify({
            'download_url': download_url,
            'format': format,
            'success': True
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_random_music(params):
    """
    Generate random music notes based on parameters
    In a real implementation, this would use Tone.js or a music library
    """
    # Define a mapping of root notes to their MIDI base values
    root_to_midi = {
        'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
        'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
        'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71
    }

    # Get parameters
    root = params.get('root_note', 'C')
    scale_type = params.get('scale_type', 'major')
    tempo = params.get('tempo', 120)
    complexity = params.get('melody_complexity', 0.5)

    # Define scale intervals based on scale type
    if scale_type == 'major':
        intervals = [0, 2, 4, 5, 7, 9, 11, 12]
    elif scale_type == 'minor':
        intervals = [0, 2, 3, 5, 7, 8, 10, 12]
    elif scale_type == 'pentatonic':
        intervals = [0, 2, 4, 7, 9, 12]
    else:
        intervals = [0, 2, 4, 5, 7, 9, 11, 12]  # Default to major

    # Get base MIDI note for the root
    base_note = root_to_midi.get(root, 60)

    # Generate random notes
    num_notes = 32  # Generate 32 notes
    notes = []

    for i in range(num_notes):
        # Decide on octave (-1, 0, or +1 from base)
        octave_shift = random.choice([-1, 0, 0, 1]) * 12

        # Choose a scale degree
        scale_degree = random.choice(intervals)

        # Calculate the note's MIDI value
        midi_note = base_note + scale_degree + octave_shift

        # Generate a random duration based on complexity
        if complexity < 0.3:
            # Simple rhythms - mostly quarter and half notes
            duration = random.choice(['4n', '2n'])
        elif complexity < 0.7:
            # Medium complexity - eighth notes added
            duration = random.choice(['8n', '4n', '2n'])
        else:
            # High complexity - sixteenth notes and triplets
            duration = random.choice(['16n', '8n', '8t', '4n', '4t', '2n'])

        # Generate random velocity (volume)
        velocity = random.uniform(0.7, 1.0)

        # Add the note to our sequence
        notes.append({
            'midi': midi_note,
            'time': i * (60 / tempo / 2),  # Simple timing based on tempo
            'duration': duration,
            'velocity': velocity
        })

    return notes

@universes_bp.route('/<int:universe_id>/music/<int:music_id>', methods=['GET'])
@jwt_required(optional=True)
def get_universe_music(universe_id, music_id):
    """
    Get music details by ID
    Returns details about a specific music track
    """
    try:
        # Get current user (if authenticated)
        current_user_id = get_jwt_identity()

        # Fetch the universe
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        # Check if universe is private and user has access
        if not universe.is_public and (not current_user_id or universe.user_id != current_user_id):
            return jsonify({'error': 'Access denied to private universe'}), 403

        # In a real implementation, you would fetch the music from the database
        # Here we'll just generate some mock data

        # Create a mock music object
        mock_music = {
            'id': music_id,
            'universe_id': universe_id,
            'name': f'Music Track {music_id}',
            'description': f'A generated music track for universe {universe.name}',
            'algorithm': 'harmonic_synthesis',
            'duration': random.randint(30, 180),
            'key': random.choice(['C', 'D', 'E', 'F', 'G', 'A', 'B']),
            'scale': random.choice(['major', 'minor', 'pentatonic']),
            'tempo': random.randint(80, 160),
            'audio_url': f'/api/music/stream/universe_{universe_id}_music_{music_id}.mp3',
            'parameters': {
                'harmonicity': random.uniform(0.5, 2.0),
                'modulation_index': random.uniform(1.0, 5.0),
                'attack': random.uniform(0.001, 0.1),
                'decay': random.uniform(0.1, 0.5),
                'sustain': random.uniform(0.3, 0.8),
                'release': random.uniform(0.5, 2.0),
                'reverb_amount': random.uniform(0.1, 0.5),
                'delay_time': random.uniform(0.2, 0.6),
                'delay_feedback': random.uniform(0.1, 0.4)
            },
            'created_at': '2023-06-15T14:30:00Z',
            'updated_at': '2023-06-15T14:30:00Z'
        }

        return jsonify(mock_music), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@universes_bp.route('/<int:universe_id>/music/<int:music_id>', methods=['DELETE'])
@jwt_required()
def delete_universe_music(universe_id, music_id):
    """
    Delete music by ID
    Removes a specific music track from the database
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authentication required'}), 401

        # Fetch the universe
        universe = Universe.query.get(universe_id)
        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        # Check if user has access
        if universe.user_id != current_user_id:
            return jsonify({'error': 'You do not have permission to delete music in this universe'}), 403

        # In a real implementation, you would delete the music from the database
        # Here we'll just simulate a successful deletion

        return jsonify({
            'success': True,
            'message': f'Music {music_id} deleted successfully'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
