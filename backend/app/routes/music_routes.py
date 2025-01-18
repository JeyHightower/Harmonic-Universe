from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from ..extensions import db
from ..models import Universe, MusicParameters
from ..extensions import limiter
from ..utils.auth import check_universe_access

music_bp = Blueprint('music', __name__)

@music_bp.route('/universes/<int:universe_id>/music', methods=['PUT'])
@jwt_required()
@limiter.limit("50 per hour")
def update_music_parameters(universe_id):
    """Update music parameters for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id, require_ownership=True):
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        if not universe.music_parameters:
            universe.music_parameters = MusicParameters(universe_id=universe_id)

        # Update music parameters
        if 'tempo' in data:
            universe.music_parameters.tempo = data['tempo']
        if 'key' in data:
            universe.music_parameters.key = data['key']
        if 'scale' in data:
            universe.music_parameters.scale = data['scale']
        if 'harmony' in data:
            universe.music_parameters.harmony = data['harmony']
        if 'rhythm_complexity' in data:
            universe.music_parameters.rhythm_complexity = data['rhythm_complexity']
        if 'melody_range' in data:
            universe.music_parameters.melody_range = data['melody_range']

        db.session.commit()
        return jsonify(universe.music_parameters.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@music_bp.route('/universes/<int:universe_id>/music', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_music_parameters(universe_id):
    """Get music parameters for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        if not universe.music_parameters:
            universe.music_parameters = MusicParameters(universe_id=universe_id)
            db.session.commit()

        return jsonify(universe.music_parameters.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500
