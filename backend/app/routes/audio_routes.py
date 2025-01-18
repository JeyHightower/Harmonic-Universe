from flask import Blueprint, jsonify, request, send_file
from app.extensions import db
from app.models.universe import Universe
from app.models.audio_parameters import AudioParameters
from flask_jwt_extended import jwt_required, get_jwt_identity
import numpy as np
from scipy.io import wavfile
import os
import tempfile
from sqlalchemy.exc import SQLAlchemyError
from ..extensions import limiter
from ..utils.auth import check_universe_access

audio_bp = Blueprint('audio', __name__)

@audio_bp.route('/universes/<int:universe_id>/audio', methods=['PUT'])
@jwt_required()
@limiter.limit("50 per hour")
def update_audio_parameters(universe_id):
    """Update audio parameters for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id, require_ownership=True):
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        if not universe.audio_parameters:
            universe.audio_parameters = AudioParameters(universe_id=universe_id)

        # Update audio parameters
        if 'waveform' in data:
            universe.audio_parameters.waveform = data['waveform']
        if 'attack' in data:
            universe.audio_parameters.attack = data['attack']
        if 'decay' in data:
            universe.audio_parameters.decay = data['decay']
        if 'sustain' in data:
            universe.audio_parameters.sustain = data['sustain']
        if 'release' in data:
            universe.audio_parameters.release = data['release']
        if 'lfo_rate' in data:
            universe.audio_parameters.lfo_rate = data['lfo_rate']
        if 'lfo_depth' in data:
            universe.audio_parameters.lfo_depth = data['lfo_depth']
        if 'filter_cutoff' in data:
            universe.audio_parameters.filter_cutoff = data['filter_cutoff']
        if 'filter_resonance' in data:
            universe.audio_parameters.filter_resonance = data['filter_resonance']
        if 'reverb_amount' in data:
            universe.audio_parameters.reverb_amount = data['reverb_amount']
        if 'delay_time' in data:
            universe.audio_parameters.delay_time = data['delay_time']
        if 'delay_feedback' in data:
            universe.audio_parameters.delay_feedback = data['delay_feedback']

        db.session.commit()
        return jsonify(universe.audio_parameters.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@audio_bp.route('/universes/<int:universe_id>/audio', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_audio_parameters(universe_id):
    """Get audio parameters for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        if not universe.audio_parameters:
            universe.audio_parameters = AudioParameters(universe_id=universe_id)
            db.session.commit()

        return jsonify(universe.audio_parameters.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@audio_bp.route('/universes/<int:universe_id>/audio/generate', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")
def generate_audio(universe_id):
    """Generate audio for a universe based on its parameters"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        if not universe.audio_parameters:
            return jsonify({'error': 'No audio parameters found'}), 404

        # Generate audio based on parameters
        sample_rate = 44100  # CD quality audio
        duration = 5.0       # 5 seconds of audio
        t = np.linspace(0, duration, int(sample_rate * duration), False)

        # Generate base waveform
        if universe.audio_parameters.waveform == 'sine':
            audio = np.sin(2 * np.pi * 440 * t)
        elif universe.audio_parameters.waveform == 'square':
            audio = np.sign(np.sin(2 * np.pi * 440 * t))
        elif universe.audio_parameters.waveform == 'sawtooth':
            audio = 2 * (t * 440 - np.floor(0.5 + t * 440))
        else:  # Default to sine
            audio = np.sin(2 * np.pi * 440 * t)

        # Apply ADSR envelope
        adsr = np.ones_like(t)
        attack_samples = int(universe.audio_parameters.attack * sample_rate)
        decay_samples = int(universe.audio_parameters.decay * sample_rate)
        release_samples = int(universe.audio_parameters.release * sample_rate)

        # Attack phase
        if attack_samples > 0:
            adsr[:attack_samples] = np.linspace(0, 1, attack_samples)

        # Decay phase
        if decay_samples > 0:
            decay_end = attack_samples + decay_samples
            adsr[attack_samples:decay_end] = np.linspace(1, universe.audio_parameters.sustain, decay_samples)

        # Sustain phase
        sustain_end = int(sample_rate * duration * 0.8)  # Release starts at 80% of duration
        adsr[decay_end:sustain_end] = universe.audio_parameters.sustain

        # Release phase
        if release_samples > 0:
            adsr[sustain_end:] = np.linspace(universe.audio_parameters.sustain, 0, len(adsr) - sustain_end)

        # Apply envelope
        audio = audio * adsr

        # Apply LFO
        if universe.audio_parameters.lfo_depth > 0:
            lfo = universe.audio_parameters.lfo_depth * np.sin(2 * np.pi * universe.audio_parameters.lfo_rate * t)
            audio = audio * (1 + lfo)

        # Normalize audio
        audio = np.int16(audio * 32767)

        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            wavfile.write(temp_file.name, sample_rate, audio)
            return send_file(
                temp_file.name,
                mimetype='audio/wav',
                as_attachment=True,
                download_name=f'universe_{universe_id}_audio.wav'
            )

    except SQLAlchemyError as e:
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500
