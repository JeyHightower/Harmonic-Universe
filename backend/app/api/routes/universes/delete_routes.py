from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Universe
from ....extensions import db
import traceback

from . import universes_bp

@universes_bp.route('/<int:universe_id>', methods=['DELETE'])
@universes_bp.route('/<int:universe_id>/', methods=['DELETE'])
@jwt_required()
def delete_universe(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        user_id = get_jwt_identity()

        # Convert user_id and universe.user_id to integers for consistent comparison
        try:
            # Ensure both user IDs are treated as integers for comparison
            jwt_user_id = int(user_id) if user_id is not None else None
            universe_user_id = int(universe.user_id) if universe.user_id is not None else None

            current_app.logger.info(f"===== DELETE UNIVERSE DEBUG =====")
            current_app.logger.info(f"Universe ID: {universe_id}")
            current_app.logger.info(f"JWT user_id: {jwt_user_id} (type: {type(jwt_user_id).__name__})")
            current_app.logger.info(f"Universe user_id: {universe_user_id} (type: {type(universe_user_id).__name__})")

            # Check if user owns this universe
            if jwt_user_id != universe_user_id:
                current_app.logger.warning(f"Access denied: User {jwt_user_id} attempted to delete universe {universe_id} owned by {universe_user_id}")
                return jsonify({
                    'message': 'Access denied',
                    'error': 'You do not have permission to delete this universe'
                }), 403

            # Soft delete
            current_app.logger.info(f"Soft deleting universe {universe_id} for user {jwt_user_id}")
            universe.is_deleted = True

            try:
                # Soft delete related scenes
                current_app.logger.info(f"Soft deleting scenes for universe {universe_id}")
                scene_count = 0
                for scene in universe.scenes:
                    if not scene.is_deleted:
                        scene.is_deleted = True
                        scene_count += 1
                current_app.logger.info(f"Soft deleted {scene_count} scenes from universe {universe_id}")

                # Soft delete related characters
                current_app.logger.info(f"Soft deleting characters for universe {universe_id}")
                character_count = 0
                for character in universe.characters:
                    if not character.is_deleted:
                        character.is_deleted = True
                        character_count += 1
                current_app.logger.info(f"Soft deleted {character_count} characters from universe {universe_id}")

                # Soft delete related notes
                current_app.logger.info(f"Soft deleting notes for universe {universe_id}")
                note_count = 0
                for note in universe.notes:
                    if not note.is_deleted:
                        note.is_deleted = True
                        note_count += 1
                current_app.logger.info(f"Soft deleted {note_count} notes from universe {universe_id}")

                db.session.commit()
                current_app.logger.info(f"Universe {universe_id} and related items successfully soft deleted")

                return jsonify({
                    'message': 'Universe deleted successfully',
                    'deleted_items': {
                        'universe': 1,
                        'scenes': scene_count,
                        'characters': character_count,
                        'notes': note_count
                    }
                }), 200

            except Exception as related_error:
                db.session.rollback()
                current_app.logger.error(f"Error deleting related items for universe {universe_id}: {str(related_error)}")
                current_app.logger.error(traceback.format_exc())
                return jsonify({
                    'message': 'Error deleting related items',
                    'error': str(related_error)
                }), 500

        except ValueError as e:
            current_app.logger.error(f"Type conversion error during delete: {str(e)}")
            return jsonify({
                'message': 'Access denied due to ID type mismatch',
                'error': str(e)
            }), 403

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting universe {universe_id}: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error deleting universe',
            'error': str(e)
        }), 500
