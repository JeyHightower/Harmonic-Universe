"""Media effect routes for the API."""
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required
from sqlalchemy import select

from ..models import db, VisualEffect, AudioTrack, Scene
from ..utils.validation import (
    validate_visual_effect_data,
    validate_audio_track_data
)

media_effects = Blueprint('media_effects', __name__)


# Visual Effects Routes


@media_effects.route(
    '/api/scenes/<int:scene_id>/visual-effects',
    methods=['GET']
)
@jwt_required()
def get_visual_effects(scene_id):
    """Get all visual effects for a scene."""
    try:
        # Check scene exists
        stmt = select(Scene).filter_by(id=scene_id)
        scene = db.session.execute(stmt).scalar_one_or_none()
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        # Get visual effects
        stmt = select(VisualEffect).filter_by(scene_id=scene_id)
        effects = db.session.execute(stmt).scalars().all()
        return jsonify([effect.to_dict() for effect in effects])
    except Exception as e:
        current_app.logger.error(f"Error in get_visual_effects: {str(e)}")
        return jsonify({'error': str(e)}), 500


@media_effects.route(
    '/api/scenes/<int:scene_id>/visual-effects',
    methods=['POST']
)
@jwt_required()
def create_visual_effect(scene_id):
    """Create a new visual effect."""
    try:
        # Validate scene exists
        stmt = select(Scene).filter_by(id=scene_id)
        scene = db.session.execute(stmt).scalar_one_or_none()
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        data = request.get_json()
        validation_error = validate_visual_effect_data(data)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        effect = VisualEffect(
            scene_id=scene_id,
            name=data['name'],
            effect_type=data['effect_type'],
            parameters=data.get('parameters', {})
        )
        db.session.add(effect)
        db.session.commit()

        return jsonify(effect.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in create_visual_effect: {str(e)}")
        return jsonify({'error': str(e)}), 500


@media_effects.route(
    '/api/scenes/<int:scene_id>/visual-effects/<int:effect_id>',
    methods=['PUT']
)
@jwt_required()
def update_visual_effect(scene_id, effect_id):
    """Update a visual effect."""
    try:
        # Validate effect exists and belongs to scene
        stmt = select(VisualEffect).filter_by(id=effect_id, scene_id=scene_id)
        effect = db.session.execute(stmt).scalar_one_or_none()
        if not effect:
            return jsonify({'error': 'Visual effect not found'}), 404

        data = request.get_json()
        validation_error = validate_visual_effect_data(data, update=True)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        if 'name' in data:
            effect.name = data['name']
        if 'effect_type' in data:
            effect.effect_type = data['effect_type']
        if 'parameters' in data:
            effect.parameters = data['parameters']

        db.session.commit()
        return jsonify(effect.to_dict())
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in update_visual_effect: {str(e)}")
        return jsonify({'error': str(e)}), 500


@media_effects.route(
    '/api/scenes/<int:scene_id>/visual-effects/<int:effect_id>',
    methods=['DELETE']
)
@jwt_required()
def delete_visual_effect(scene_id, effect_id):
    """Delete a visual effect."""
    try:
        stmt = select(VisualEffect).filter_by(id=effect_id, scene_id=scene_id)
        effect = db.session.execute(stmt).scalar_one_or_none()
        if not effect:
            return jsonify({'error': 'Visual effect not found'}), 404

        db.session.delete(effect)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in delete_visual_effect: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Audio Track Routes


@media_effects.route(
    '/api/scenes/<int:scene_id>/audio-tracks',
    methods=['GET']
)
@jwt_required()
def get_audio_tracks(scene_id):
    """Get all audio tracks for a scene."""
    try:
        # Check scene exists
        stmt = select(Scene).filter_by(id=scene_id)
        scene = db.session.execute(stmt).scalar_one_or_none()
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        # Get audio tracks
        stmt = select(AudioTrack).filter_by(scene_id=scene_id)
        tracks = db.session.execute(stmt).scalars().all()
        return jsonify([track.to_dict() for track in tracks])
    except Exception as e:
        current_app.logger.error(f"Error in get_audio_tracks: {str(e)}")
        return jsonify({'error': str(e)}), 500


@media_effects.route(
    '/api/scenes/<int:scene_id>/audio-tracks',
    methods=['POST']
)
@jwt_required()
def create_audio_track(scene_id):
    """Create a new audio track."""
    try:
        # Validate scene exists
        stmt = select(Scene).filter_by(id=scene_id)
        scene = db.session.execute(stmt).scalar_one_or_none()
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        data = request.get_json()
        validation_error = validate_audio_track_data(data)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        track = AudioTrack(
            scene_id=scene_id,
            name=data['name'],
            track_type=data['track_type'],
            file_path=data.get('file_path'),
            parameters=data.get('parameters', {})
        )
        db.session.add(track)
        db.session.commit()

        return jsonify(track.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in create_audio_track: {str(e)}")
        return jsonify({'error': str(e)}), 500


@media_effects.route(
    '/api/scenes/<int:scene_id>/audio-tracks/<int:track_id>',
    methods=['PUT']
)
@jwt_required()
def update_audio_track(scene_id, track_id):
    """Update an audio track."""
    try:
        stmt = select(AudioTrack).filter_by(id=track_id, scene_id=scene_id)
        track = db.session.execute(stmt).scalar_one_or_none()
        if not track:
            return jsonify({'error': 'Audio track not found'}), 404

        data = request.get_json()
        validation_error = validate_audio_track_data(data, update=True)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        if 'name' in data:
            track.name = data['name']
        if 'track_type' in data:
            track.track_type = data['track_type']
        if 'file_path' in data:
            track.file_path = data['file_path']
        if 'parameters' in data:
            track.parameters = data['parameters']

        db.session.commit()
        return jsonify(track.to_dict())
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in update_audio_track: {str(e)}")
        return jsonify({'error': str(e)}), 500


@media_effects.route(
    '/api/scenes/<int:scene_id>/audio-tracks/<int:track_id>',
    methods=['DELETE']
)
@jwt_required()
def delete_audio_track(scene_id, track_id):
    """Delete an audio track."""
    try:
        stmt = select(AudioTrack).filter_by(id=track_id, scene_id=scene_id)
        track = db.session.execute(stmt).scalar_one_or_none()
        if not track:
            return jsonify({'error': 'Audio track not found'}), 404

        db.session.delete(track)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in delete_audio_track: {str(e)}")
        return jsonify({'error': str(e)}), 500
