"""Scene routes for the API."""
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from ..models import db, Scene, Storyboard, Universe
from ..utils.auth import check_universe_access
from ..utils.validation import validate_scene_data
from flask_jwt_extended import jwt_required, get_jwt_identity

bp = Blueprint('scenes', __name__)

@bp.route(
    '/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes',
    methods=['GET']
)
@login_required
def get_scenes(universe_id, storyboard_id):
    """Get all scenes for a storyboard."""
    universe = Universe.query.get_or_404(universe_id)
    if not check_universe_access(universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    storyboard = Storyboard.query.filter_by(
        id=storyboard_id,
        universe_id=universe_id
    ).first_or_404()

    scenes = Scene.query.filter_by(
        storyboard_id=storyboard_id
    ).order_by(Scene.sequence).all()

    return jsonify([scene.to_dict() for scene in scenes])

@bp.route(
    '/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes/<int:scene_id>',
    methods=['GET']
)
@login_required
def get_scene(universe_id, storyboard_id, scene_id):
    """Get a specific scene."""
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

    return jsonify(scene.to_dict())

@bp.route(
    '/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes',
    methods=['POST']
)
@login_required
def create_scene(universe_id, storyboard_id):
    """Create a new scene."""
    universe = Universe.query.get_or_404(universe_id)
    if not check_universe_access(universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    storyboard = Storyboard.query.filter_by(
        id=storyboard_id,
        universe_id=universe_id
    ).first_or_404()

    data = request.get_json()
    validation_error = validate_scene_data(data)
    if validation_error:
        return jsonify({'error': validation_error}), 400

    scene = Scene(
        storyboard_id=storyboard_id,
        title=data['title'],
        sequence=data['sequence'],
        content=data['content']
    )

    try:
        # Adjust sequences of other scenes if necessary
        if scene.sequence < len(storyboard.scenes):
            Scene.query.filter(
                Scene.storyboard_id == storyboard_id,
                Scene.sequence >= scene.sequence
            ).update(
                {Scene.sequence: Scene.sequence + 1},
                synchronize_session=False
            )

        db.session.add(scene)
        db.session.commit()
        return jsonify(scene.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route(
    '/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes/<int:scene_id>',
    methods=['PUT']
)
@login_required
def update_scene(universe_id, storyboard_id, scene_id):
    """Update a scene."""
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
    validation_error = validate_scene_data(data, update=True)
    if validation_error:
        return jsonify({'error': validation_error}), 400

    try:
        if 'title' in data:
            scene.title = data['title']
        if 'sequence' in data and data['sequence'] != scene.sequence:
            old_sequence = scene.sequence
            new_sequence = data['sequence']

            # Update sequences of other scenes
            if new_sequence > old_sequence:
                Scene.query.filter(
                    Scene.storyboard_id == storyboard_id,
                    Scene.sequence > old_sequence,
                    Scene.sequence <= new_sequence
                ).update(
                    {Scene.sequence: Scene.sequence - 1},
                    synchronize_session=False
                )
            else:
                Scene.query.filter(
                    Scene.storyboard_id == storyboard_id,
                    Scene.sequence >= new_sequence,
                    Scene.sequence < old_sequence
                ).update(
                    {Scene.sequence: Scene.sequence + 1},
                    synchronize_session=False
                )

            scene.sequence = new_sequence

        if 'content' in data:
            scene.content = data['content']

        db.session.commit()
        return jsonify(scene.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route(
    '/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes/<int:scene_id>',
    methods=['DELETE']
)
@login_required
def delete_scene(universe_id, storyboard_id, scene_id):
    """Delete a scene."""
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

    try:
        # Update sequences of subsequent scenes
        Scene.query.filter(
            Scene.storyboard_id == storyboard_id,
            Scene.sequence > scene.sequence
        ).update(
            {Scene.sequence: Scene.sequence - 1},
            synchronize_session=False
        )

        db.session.delete(scene)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route(
    '/api/universes/<int:universe_id>/storyboards/<int:storyboard_id>/scenes/reorder',
    methods=['PUT']
)
@login_required
def reorder_scenes(universe_id, storyboard_id):
    """Reorder scenes in a storyboard."""
    universe = Universe.query.get_or_404(universe_id)
    if not check_universe_access(universe, current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    storyboard = Storyboard.query.filter_by(
        id=storyboard_id,
        universe_id=universe_id
    ).first_or_404()

    data = request.get_json()
    if not data or 'scene_ids' not in data:
        return jsonify({'error': 'Scene IDs are required'}), 400

    scene_ids = data['scene_ids']
    if not isinstance(scene_ids, list):
        return jsonify({'error': 'Scene IDs must be an array'}), 400

    # Verify all scenes exist and belong to this storyboard
    scenes = Scene.query.filter(
        Scene.id.in_(scene_ids),
        Scene.storyboard_id == storyboard_id
    ).all()

    if len(scenes) != len(scene_ids):
        return jsonify({'error': 'Invalid scene IDs provided'}), 400

    try:
        # Update sequences based on the order in scene_ids
        for index, scene_id in enumerate(scene_ids):
            Scene.query.filter_by(id=scene_id).update(
                {'sequence': index},
                synchronize_session=False
            )

        db.session.commit()

        # Return updated scenes in their new order
        updated_scenes = Scene.query.filter_by(
            storyboard_id=storyboard_id
        ).order_by(Scene.sequence).all()

        return jsonify([scene.to_dict() for scene in updated_scenes])
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
