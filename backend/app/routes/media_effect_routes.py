"""Media effect routes for the API."""
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from ..models import db, VisualEffect, AudioTrack, Scene, Storyboard, Universe
from ..utils.auth import check_universe_access
from ..utils.validation import validate_visual_effect_data, validate_audio_track_data

bp = Blueprint('media_effects', __name__)

# Visual Effects Routes
@bp.route('/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes/<int:scene_id>/visual-effects', methods=['GET'])
@login_required
def get_visual_effects(universe_id, storyboard_id, scene_id):
    """Get all visual effects for a scene."""
    universe = Universe.query.get_or_404(universe_id)
    if not check_universe_access(universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    storyboard = Storyboard.query.filter_by(
        id=storyboard_id,
        universe_id=universe_id
    ).first_or_404()

    scene = Scene.query.filter_by(
        id=scene_id,
        storyboard_id=storyboard_id
    ).first_or_404()

    effects = VisualEffect.query.filter_by(scene_id=scene_id).order_by(VisualEffect.start_time).all()
    return jsonify([effect.to_dict() for effect in effects])

@bp.route('/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes/<int:scene_id>/visual-effects', methods=['POST'])
@login_required
def create_visual_effect(universe_id, storyboard_id, scene_id):
    """Create a new visual effect."""
    universe = Universe.query.get_or_404(universe_id)
    if not check_universe_access(universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    storyboard = Storyboard.query.filter_by(
        id=storyboard_id,
        universe_id=universe_id
    ).first_or_404()

    scene = Scene.query.filter_by(
        id=scene_id,
        storyboard_id=storyboard_id
    ).first_or_404()

    data = request.get_json()
    validation_error = validate_visual_effect_data(data)
    if validation_error:
        return jsonify({'error': validation_error}), 400

    effect = VisualEffect(
        scene_id=scene_id,
        effect_type=data['effect_type'],
        parameters=data['parameters'],
        start_time=data['start_time'],
        duration=data['duration']
    )

    try:
        db.session.add(effect)
        db.session.commit()
        return jsonify(effect.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes/<int:scene_id>/visual-effects/<int:effect_id>', methods=['PUT'])
@login_required
def update_visual_effect(universe_id, storyboard_id, scene_id, effect_id):
    """Update a visual effect."""
    universe = Universe.query.get_or_404(universe_id)
    if not check_universe_access(universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    storyboard = Storyboard.query.filter_by(
        id=storyboard_id,
        universe_id=universe_id
    ).first_or_404()

    scene = Scene.query.filter_by(
        id=scene_id,
        storyboard_id=storyboard_id
    ).first_or_404()

    effect = VisualEffect.query.filter_by(
        id=effect_id,
        scene_id=scene_id
    ).first_or_404()

    data = request.get_json()
    validation_error = validate_visual_effect_data(data, update=True)
    if validation_error:
        return jsonify({'error': validation_error}), 400

    try:
        if 'effect_type' in data:
            effect.effect_type = data['effect_type']
        if 'parameters' in data:
            effect.parameters = data['parameters']
        if 'start_time' in data:
            effect.start_time = data['start_time']
        if 'duration' in data:
            effect.duration = data['duration']

        db.session.commit()
        return jsonify(effect.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes/<int:scene_id>/visual-effects/<int:effect_id>', methods=['DELETE'])
@login_required
def delete_visual_effect(universe_id, storyboard_id, scene_id, effect_id):
    """Delete a visual effect."""
    universe = Universe.query.get_or_404(universe_id)
    if not check_universe_access(universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    storyboard = Storyboard.query.filter_by(
        id=storyboard_id,
        universe_id=universe_id
    ).first_or_404()

    scene = Scene.query.filter_by(
        id=scene_id,
        storyboard_id=storyboard_id
    ).first_or_404()

    effect = VisualEffect.query.filter_by(
        id=effect_id,
        scene_id=scene_id
    ).first_or_404()

    try:
        db.session.delete(effect)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Audio Track Routes
@bp.route('/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes/<int:scene_id>/audio-tracks', methods=['GET'])
@login_required
def get_audio_tracks(universe_id, storyboard_id, scene_id):
    """Get all audio tracks for a scene."""
    universe = Universe.query.get_or_404(universe_id)
    if not check_universe_access(universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    storyboard = Storyboard.query.filter_by(
        id=storyboard_id,
        universe_id=universe_id
    ).first_or_404()

    scene = Scene.query.filter_by(
        id=scene_id,
        storyboard_id=storyboard_id
    ).first_or_404()

    tracks = AudioTrack.query.filter_by(scene_id=scene_id).order_by(AudioTrack.start_time).all()
    return jsonify([track.to_dict() for track in tracks])

@bp.route('/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes/<int:scene_id>/audio-tracks', methods=['POST'])
@login_required
def create_audio_track(universe_id, storyboard_id, scene_id):
    """Create a new audio track."""
    universe = Universe.query.get_or_404(universe_id)
    if not check_universe_access(universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    storyboard = Storyboard.query.filter_by(
        id=storyboard_id,
        universe_id=universe_id
    ).first_or_404()

    scene = Scene.query.filter_by(
        id=scene_id,
        storyboard_id=storyboard_id
    ).first_or_404()

    data = request.get_json()
    validation_error = validate_audio_track_data(data)
    if validation_error:
        return jsonify({'error': validation_error}), 400

    track = AudioTrack(
        scene_id=scene_id,
        track_type=data['track_type'],
        parameters=data['parameters'],
        start_time=data['start_time'],
        duration=data['duration'],
        volume=data.get('volume', 1.0)
    )

    try:
        db.session.add(track)
        db.session.commit()
        return jsonify(track.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes/<int:scene_id>/audio-tracks/<int:track_id>', methods=['PUT'])
@login_required
def update_audio_track(universe_id, storyboard_id, scene_id, track_id):
    """Update an audio track."""
    universe = Universe.query.get_or_404(universe_id)
    if not check_universe_access(universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    storyboard = Storyboard.query.filter_by(
        id=storyboard_id,
        universe_id=universe_id
    ).first_or_404()

    scene = Scene.query.filter_by(
        id=scene_id,
        storyboard_id=storyboard_id
    ).first_or_404()

    track = AudioTrack.query.filter_by(
        id=track_id,
        scene_id=scene_id
    ).first_or_404()

    data = request.get_json()
    validation_error = validate_audio_track_data(data, update=True)
    if validation_error:
        return jsonify({'error': validation_error}), 400

    try:
        if 'track_type' in data:
            track.track_type = data['track_type']
        if 'parameters' in data:
            track.parameters = data['parameters']
        if 'start_time' in data:
            track.start_time = data['start_time']
        if 'duration' in data:
            track.duration = data['duration']
        if 'volume' in data:
            track.volume = data['volume']

        db.session.commit()
        return jsonify(track.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes/<int:scene_id>/audio-tracks/<int:track_id>', methods=['DELETE'])
@login_required
def delete_audio_track(universe_id, storyboard_id, scene_id, track_id):
    """Delete an audio track."""
    universe = Universe.query.get_or_404(universe_id)
    if not check_universe_access(universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    storyboard = Storyboard.query.filter_by(
        id=storyboard_id,
        universe_id=universe_id
    ).first_or_404()

    scene = Scene.query.filter_by(
        id=scene_id,
        storyboard_id=storyboard_id
    ).first_or_404()

    track = AudioTrack.query.filter_by(
        id=track_id,
        scene_id=scene_id
    ).first_or_404()

    try:
        db.session.delete(track)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
