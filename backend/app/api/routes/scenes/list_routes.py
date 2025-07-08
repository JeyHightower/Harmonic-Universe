from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Scene, Universe
from ...models.scene import Scene
from ....extensions import db
import traceback
from ....utils.decorators import exempt_options_requests

from . import scenes_bp  # import the Blueprint instance

@scenes_bp.route('/universe/<int:universe_id>', methods=['GET', 'OPTIONS'])
@scenes_bp.route('/universe/<int:universe_id>/', methods=['GET', 'OPTIONS'])
@exempt_options_requests()
@jwt_required(optional=True)
def get_scenes(universe_id):
    # Handle OPTIONS requests - let Flask-CORS handle this automatically
    if request.method == 'OPTIONS':
        return current_app.make_default_options_response()

    try:
        current_app.logger.info(f"Fetching scenes for universe ID: {universe_id}")

        # Check if universe_id is valid
        if not universe_id or universe_id <= 0:
            current_app.logger.error(f"Invalid universe ID: {universe_id}")
            return jsonify({
                'message': 'Invalid universe ID',
                'error': 'Universe ID must be a positive integer',
                'scenes': [] # Return empty scenes array for graceful handling
            }), 400

        # Get universe with additional error handling
        try:
            universe = Universe.query.get(universe_id)

            if not universe:
                current_app.logger.warning(f"Universe with ID {universe_id} not found")
                return jsonify({
                    'message': 'Universe not found',
                    'error': f'No universe found with ID {universe_id}',
                    'scenes': [] # Return empty scenes array for graceful handling
                }), 404

            if hasattr(universe, 'is_deleted') and universe.is_deleted:
                current_app.logger.warning(f"Attempted to access deleted universe: {universe_id}")
                return jsonify({
                    'message': 'Universe has been deleted',
                    'scenes': [] # Return empty scenes array for graceful handling
                }), 404
        except Exception as universe_error:
            current_app.logger.error(f"Error fetching universe {universe_id}: {str(universe_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error retrieving universe',
                'error': str(universe_error),
                'scenes': [] # Return empty scenes array for graceful handling
            }), 500

        # Check permissions
        user_id = get_jwt_identity()
        current_app.logger.info(f"User {user_id} (type: {type(user_id)}) accessing universe {universe_id} (owner: {universe.user_id} (type: {type(universe.user_id)}))")
        current_app.logger.info(f"Universe is_public: {universe.is_public} (type: {type(universe.is_public)})")
        current_app.logger.info(f"Permission check: not universe.is_public = {not universe.is_public}, user_id is None = {user_id is None}, universe.user_id != user_id = {universe.user_id != user_id}")

        # Cast both IDs to int for comparison
        try:
            user_id_int = int(user_id) if user_id is not None else None
            universe_user_id_int = int(universe.user_id) if universe.user_id is not None else None
        except Exception as e:
            current_app.logger.error(f"Error casting user IDs to int: {e}")
            return jsonify({
                'message': 'Internal server error',
                'scenes': []
            }), 500

        if not universe.is_public and (user_id_int is None or universe_user_id_int != user_id_int):
            current_app.logger.warning(f"Access denied: User {user_id} attempting to access private universe {universe_id}")
            return jsonify({
                'message': 'Access denied',
                'scenes': [] # Return empty scenes array for graceful handling
            }), 403

        # Get all scenes for the universe with clean session management
        try:
            # Ensure we're using a fresh session
            db.session.expire_all()

            # Get scenes with basic query to avoid complex serialization issues
            scenes = Scene.query.filter_by(
                universe_id=universe_id,
                is_deleted=False
            ).all()

            current_app.logger.info(f"Found {len(scenes) if scenes else 0} scenes for universe {universe_id}")

            # Safely convert scenes to dictionaries with error handling
            scene_list = []
            for scene in scenes:
                try:
                    # Use a simplified dictionary to avoid serialization issues
                    scene_dict = {
                        'id': scene.id,
                        'name': str(scene.name) if hasattr(scene, 'name') and scene.name is not None else "Unknown",
                        'universe_id': scene.universe_id,
                        'is_public': bool(scene.is_public) if hasattr(scene, 'is_public') else False,
                        'is_deleted': bool(scene.is_deleted) if hasattr(scene, 'is_deleted') else False
                    }

                    # Add optional fields that might cause problems
                    if hasattr(scene, 'description') and scene.description is not None:
                        scene_dict['description'] = str(scene.description)

                    if hasattr(scene, 'created_at') and scene.created_at is not None:
                        scene_dict['created_at'] = str(scene.created_at)

                    if hasattr(scene, 'updated_at') and scene.updated_at is not None:
                        scene_dict['updated_at'] = str(scene.updated_at)

                    scene_list.append(scene_dict)
                except Exception as scene_error:
                    current_app.logger.error(f"Error converting scene {scene.id} to dict: {str(scene_error)}")
                    # Add minimal data if conversion fails
                    scene_list.append({
                        'id': scene.id,
                        'name': 'Error: Could not load scene data',
                        'universe_id': universe_id,
                        'error': str(scene_error)
                    })

            return jsonify({
                'message': 'Scenes retrieved successfully',
                'scenes': scene_list
            }), 200

        except Exception as query_error:
            current_app.logger.error(f"Database error querying scenes: {str(query_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Database error retrieving scenes',
                'error': str(query_error),
                'scenes': [] # Return empty scenes array for graceful handling
            }), 500

    except Exception as e:
        current_app.logger.error(f"Unexpected error retrieving scenes: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error retrieving scenes',
            'error': str(e),
            'scenes': [] # Return empty scenes array for graceful handling
        }), 500

@scenes_bp.route('/', methods=['GET'])
@jwt_required()
def list_scenes():
    # This route returns all scenes a user has access to across all universes
    try:
        current_app.logger.info(f"Listing all accessible scenes")
        user_id = get_jwt_identity()

        # Parameters for filtering and pagination
        query_params = request.args.to_dict()
        page = int(query_params.get('page', 1))
        per_page = min(int(query_params.get('per_page', 20)), 100)  # Limit max per page
        universe_id = query_params.get('universe_id')

        current_app.logger.info(f"Query params: page={page}, per_page={per_page}, universe_id={universe_id}")

        if universe_id:
            try:
                universe_id = int(universe_id)
            except ValueError:
                return jsonify({
                    'message': 'Invalid universe ID',
                    'error': 'Universe ID must be an integer'
                }), 400

        # Base query for scenes the user can access (not deleted)
        scene_query = Scene.query.filter_by(is_deleted=False)

        # Join with Universe to check access permissions
        scene_query = scene_query.join(
            Universe, Scene.universe_id == Universe.id
        ).filter(
            # User either owns the universe or it's public
            ((Universe.user_id == user_id) | (Universe.is_public == True))
        )

        # Filter by universe_id if provided
        if universe_id:
            scene_query = scene_query.filter(Scene.universe_id == universe_id)

        # Execute the query with pagination
        try:
            paginated_scenes = scene_query.paginate(page=page, per_page=per_page, error_out=False)

            scenes_list = []
            for scene in paginated_scenes.items:
                try:
                    scene_dict = {
                        'id': scene.id,
                        'name': scene.name,
                        'universe_id': scene.universe_id,
                        'is_public': bool(scene.is_public) if hasattr(scene, 'is_public') else False
                    }

                    # Add optional fields
                    if hasattr(scene, 'description') and scene.description:
                        scene_dict['description'] = scene.description

                    if hasattr(scene, 'created_at') and scene.created_at:
                        scene_dict['created_at'] = str(scene.created_at)

                    if hasattr(scene, 'updated_at') and scene.updated_at:
                        scene_dict['updated_at'] = str(scene.updated_at)

                    scenes_list.append(scene_dict)
                except Exception as scene_error:
                    current_app.logger.error(f"Error converting scene {scene.id} to dict: {str(scene_error)}")
                    scenes_list.append({
                        'id': scene.id,
                        'name': 'Error: Could not load scene data',
                        'error': str(scene_error)
                    })

            # Include pagination metadata
            pagination = {
                'page': paginated_scenes.page,
                'pages': paginated_scenes.pages,
                'per_page': paginated_scenes.per_page,
                'total': paginated_scenes.total,
                'has_next': paginated_scenes.has_next,
                'has_prev': paginated_scenes.has_prev
            }

            return jsonify({
                'message': 'Scenes retrieved successfully',
                'scenes': scenes_list,
                'pagination': pagination
            }), 200

        except Exception as pagination_error:
            current_app.logger.error(f"Pagination error: {str(pagination_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'message': 'Error retrieving paginated scenes',
                'error': str(pagination_error)
            }), 500

    except Exception as e:
        current_app.logger.error(f"Unexpected error listing scenes: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error listing scenes',
            'error': str(e)
        }), 500

@scenes_bp.route('/demo-universe-1/scenes/', methods=['GET', 'OPTIONS'], endpoint='get_demo_scenes')
@scenes_bp.route('/demo-universe-1/scenes', methods=['GET', 'OPTIONS'], endpoint='get_demo_scenes_no_slash')
@jwt_required(optional=True)
@exempt_options_requests()
def get_demo_scenes():
    """Special handler for demo universe scene requests"""
    try:
        # Return demo scenes data
        demo_scenes = [
            {
                'id': 'demo-scene-1',
                'name': 'Demo Scene 1',
                'description': 'First demo scene',
                'universe_id': 'demo-universe-1',
                'created_at': '2025-01-01T00:00:00Z',
                'updated_at': '2025-01-01T00:00:00Z',
                'is_public': True,
                'order': 1
            },
            {
                'id': 'demo-scene-2',
                'name': 'Demo Scene 2',
                'description': 'Second demo scene',
                'universe_id': 'demo-universe-1',
                'created_at': '2025-01-01T00:00:00Z',
                'updated_at': '2025-01-01T00:00:00Z',
                'is_public': True,
                'order': 2
            }
        ]

        return jsonify({
            'message': 'Scenes retrieved successfully',
            'scenes': demo_scenes
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error retrieving demo scenes: {str(e)}")
        return jsonify({
            'message': 'Error retrieving demo scenes',
            'error': str(e),
            'scenes': []
        }), 500
