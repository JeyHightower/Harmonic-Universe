from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import select
from app.models import db, Storyboard, Scene, VisualEffect, AudioTrack
from app.utils.auth import require_universe_access
from app.utils.validation import validate_request_json
from sqlalchemy.exc import SQLAlchemyError

bp = Blueprint('storyboard', __name__)

# Storyboard routes
@bp.route('/api/universes/<int:universe_id>/storyboards', methods=['GET'])
@jwt_required()
@require_universe_access()  # Default role is 'viewer'
def get_storyboards(universe_id):
    try:
        stmt = select(Storyboard).filter_by(universe_id=universe_id)
        storyboards = db.session.execute(stmt).scalars().all()
        return jsonify([storyboard.to_dict() for storyboard in storyboards])
    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/universes/<int:universe_id>/storyboards', methods=['POST'])
@jwt_required()
@require_universe_access('editor')
@validate_request_json(['title'])
def create_storyboard(universe_id):
    try:
        data = request.json
        storyboard = Storyboard(
            universe_id=universe_id,
            title=data['title'],
            description=data.get('description', ''),
            metadata=data.get('metadata', {})
        )
        db.session.add(storyboard)
        db.session.commit()
        return jsonify(storyboard.to_dict()), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/storyboards/<int:storyboard_id>', methods=['GET'])
@jwt_required()
@require_universe_access()  # Default role is 'viewer'
def get_storyboard(storyboard_id):
    try:
        stmt = select(Storyboard).filter_by(id=storyboard_id)
        storyboard = db.session.execute(stmt).scalar_one_or_none()
        if not storyboard:
            return jsonify({'error': 'Storyboard not found'}), 404
        return jsonify(storyboard.to_dict())
    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/storyboards/<int:storyboard_id>', methods=['PUT'])
@jwt_required()
@require_universe_access('editor')
def update_storyboard(storyboard_id):
    try:
        stmt = select(Storyboard).filter_by(id=storyboard_id)
        storyboard = db.session.execute(stmt).scalar_one_or_none()
        if not storyboard:
            return jsonify({'error': 'Storyboard not found'}), 404

        data = request.json
        if 'title' in data:
            storyboard.title = data['title']
        if 'description' in data:
            storyboard.description = data['description']
        if 'metadata' in data:
            storyboard.metadata = data['metadata']

        db.session.commit()
        return jsonify(storyboard.to_dict())
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/storyboards/<int:storyboard_id>', methods=['DELETE'])
@jwt_required()
@require_universe_access('editor')
def delete_storyboard(storyboard_id):
    try:
        stmt = select(Storyboard).filter_by(id=storyboard_id)
        storyboard = db.session.execute(stmt).scalar_one_or_none()
        if not storyboard:
            return jsonify({'error': 'Storyboard not found'}), 404

        db.session.delete(storyboard)
        db.session.commit()
        return '', 204
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Scene routes
@bp.route('/api/storyboards/<int:storyboard_id>/scenes', methods=['GET'])
@jwt_required()
@require_universe_access()  # Default role is 'viewer'
def get_scenes(storyboard_id):
    try:
        stmt = select(Scene).filter_by(storyboard_id=storyboard_id).order_by(Scene.sequence)
        scenes = db.session.execute(stmt).scalars().all()
        return jsonify([scene.to_dict() for scene in scenes])
    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/storyboards/<int:storyboard_id>/scenes', methods=['POST'])
@jwt_required()
@require_universe_access('editor')
@validate_request_json(['title', 'sequence'])
def create_scene(storyboard_id):
    try:
        data = request.json
        scene = Scene(
            storyboard_id=storyboard_id,
            title=data['title'],
            sequence=data['sequence'],
            content=data.get('content', {})
        )
        db.session.add(scene)
        db.session.commit()
        return jsonify(scene.to_dict()), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/scenes/<int:scene_id>', methods=['PUT'])
@jwt_required()
@require_universe_access('editor')
def update_scene(scene_id):
    try:
        stmt = select(Scene).filter_by(id=scene_id)
        scene = db.session.execute(stmt).scalar_one_or_none()
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        data = request.json
        if 'title' in data:
            scene.title = data['title']
        if 'sequence' in data:
            scene.sequence = data['sequence']
        if 'content' in data:
            scene.content = data['content']

        db.session.commit()
        return jsonify(scene.to_dict())
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/scenes/<int:scene_id>', methods=['DELETE'])
@jwt_required()
@require_universe_access('editor')
def delete_scene(scene_id):
    try:
        stmt = select(Scene).filter_by(id=scene_id)
        scene = db.session.execute(stmt).scalar_one_or_none()
        if not scene:
            return jsonify({'error': 'Scene not found'}), 404

        db.session.delete(scene)
        db.session.commit()
        return '', 204
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Visual Effect routes
@bp.route('/api/scenes/<int:scene_id>/visual-effects', methods=['GET'])
@jwt_required()
@require_universe_access()  # Default role is 'viewer'
def get_visual_effects(scene_id):
    try:
        effects = VisualEffect.query.filter_by(scene_id=scene_id).all()
        return jsonify([effect.to_dict() for effect in effects])
    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/scenes/<int:scene_id>/visual-effects', methods=['POST'])
@jwt_required()
@require_universe_access('editor')
@validate_request_json(['effect_type', 'start_time', 'duration'])
def create_visual_effect(scene_id):
    try:
        data = request.json
        effect = VisualEffect(
            scene_id=scene_id,
            effect_type=data['effect_type'],
            parameters=data.get('parameters', {}),
            start_time=data['start_time'],
            duration=data['duration']
        )
        db.session.add(effect)
        db.session.commit()
        return jsonify(effect.to_dict()), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Audio Track routes
@bp.route('/api/scenes/<int:scene_id>/audio-tracks', methods=['GET'])
@jwt_required()
@require_universe_access()  # Default role is 'viewer'
def get_audio_tracks(scene_id):
    try:
        tracks = AudioTrack.query.filter_by(scene_id=scene_id).all()
        return jsonify([track.to_dict() for track in tracks])
    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/scenes/<int:scene_id>/audio-tracks', methods=['POST'])
@jwt_required()
@require_universe_access('editor')
@validate_request_json(['track_type', 'start_time', 'duration'])
def create_audio_track(scene_id):
    try:
        data = request.json
        track = AudioTrack(
            scene_id=scene_id,
            track_type=data['track_type'],
            parameters=data.get('parameters', {}),
            start_time=data['start_time'],
            duration=data['duration'],
            volume=data.get('volume', 1.0)
        )
        db.session.add(track)
        db.session.commit()
        return jsonify(track.to_dict()), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
