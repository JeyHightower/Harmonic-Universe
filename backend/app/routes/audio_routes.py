from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from ..extensions import db, limiter
from ..models import Universe, AudioParameters, MusicParameters
from ..utils.auth import check_universe_access
from ..services.audio_processor import AudioProcessor
from ..services.harmony_engine import HarmonyEngine

audio_bp = Blueprint('audio', __name__, url_prefix='/api/audio')

@audio_bp.route('/settings/<int:universe_id>', methods=['POST'])
@jwt_required()
@limiter.limit("30 per hour")
def create_audio_settings(universe_id):
    """Create audio settings for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No settings provided'}), 400

        # Create audio settings
        audio_settings = AudioParameters(
            universe_id=universe_id,
            volume=data.get('volume', 1.0),
            reverb=data.get('reverb', 0.0),
            delay=data.get('delay', 0.0),
            eq_low=data.get('eq_low', 0.0),
            eq_mid=data.get('eq_mid', 0.0),
            eq_high=data.get('eq_high', 0.0)
        )

        # Create music settings
        music_settings = MusicParameters(
            universe_id=universe_id,
            tempo=data.get('tempo', 120),
            key=data.get('key', 'C'),
            scale=data.get('scale', 'major'),
            harmony_complexity=data.get('harmony_complexity', 0.5)
        )

        db.session.add(audio_settings)
        db.session.add(music_settings)
        db.session.commit()

        return jsonify({
            'audio': audio_settings.to_dict(),
            'music': music_settings.to_dict()
        }), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@audio_bp.route('/settings/<int:universe_id>', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_audio_settings(universe_id):
    """Get audio settings for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        audio_settings = AudioParameters.query.filter_by(universe_id=universe_id).first()
        music_settings = MusicParameters.query.filter_by(universe_id=universe_id).first()

        if not audio_settings or not music_settings:
            return jsonify({'error': 'Settings not found'}), 404

        return jsonify({
            'audio': audio_settings.to_dict(),
            'music': music_settings.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audio_bp.route('/settings/<int:universe_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("50 per hour")
def update_audio_settings(universe_id):
    """Update audio settings for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No update data provided'}), 400

        audio_settings = AudioParameters.query.filter_by(universe_id=universe_id).first()
        music_settings = MusicParameters.query.filter_by(universe_id=universe_id).first()

        if not audio_settings or not music_settings:
            return jsonify({'error': 'Settings not found'}), 404

        # Update audio settings
        if 'volume' in data:
            audio_settings.volume = data['volume']
        if 'reverb' in data:
            audio_settings.reverb = data['reverb']
        if 'delay' in data:
            audio_settings.delay = data['delay']
        if 'eq_low' in data:
            audio_settings.eq_low = data['eq_low']
        if 'eq_mid' in data:
            audio_settings.eq_mid = data['eq_mid']
        if 'eq_high' in data:
            audio_settings.eq_high = data['eq_high']

        # Update music settings
        if 'tempo' in data:
            music_settings.tempo = data['tempo']
        if 'key' in data:
            music_settings.key = data['key']
        if 'scale' in data:
            music_settings.scale = data['scale']
        if 'harmony_complexity' in data:
            music_settings.harmony_complexity = data['harmony_complexity']

        db.session.commit()

        return jsonify({
            'audio': audio_settings.to_dict(),
            'music': music_settings.to_dict()
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@audio_bp.route('/generate/<int:universe_id>', methods=['POST'])
@jwt_required()
@limiter.limit("10 per hour")
def generate_audio(universe_id):
    """Generate audio for a universe based on its settings"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        audio_settings = AudioParameters.query.filter_by(universe_id=universe_id).first()
        music_settings = MusicParameters.query.filter_by(universe_id=universe_id).first()

        if not audio_settings or not music_settings:
            return jsonify({'error': 'Settings not found'}), 404

        # Generate audio using combined settings
        audio_processor = AudioProcessor()
        music_service = HarmonyEngine()

        audio_data = audio_processor.generate_audio(audio_settings)
        music_data = music_service.generate_music(music_settings)

        # Combine audio and music
        combined_data = audio_processor.mix_audio_and_music(audio_data, music_data)

        return jsonify({
            'audio_url': combined_data['url'],
            'duration': combined_data['duration'],
            'format': combined_data['format']
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
