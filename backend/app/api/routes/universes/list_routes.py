from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Universe
from ....extensions import db
import traceback

from . import universes_bp

@universes_bp.route('/', methods=['GET'])
@jwt_required()
def get_universes():
    try:
        # Get query parameters
        public_only = request.args.get('public', 'false').lower() == 'true'
        user_only = request.args.get('user_only', 'false').lower() == 'true'
        user_id = get_jwt_identity()
        
        current_app.logger.info(f"Fetching universes for user {user_id}, public_only: {public_only}, user_only: {user_only}")

        try:
            # Build query
            query = Universe.query.filter_by(is_deleted=False)
            
            current_app.logger.debug(f"Base query: {str(query)}")

            if user_only:
                # Only include user's own universes when user_only is true
                current_app.logger.debug(f"Filtering by user_id: {user_id}")
                query = query.filter_by(user_id=user_id)
            elif public_only:
                current_app.logger.debug(f"Filtering by public only")
                query = query.filter_by(is_public=True)
            else:
                # Include user's own universes and public universes
                current_app.logger.debug(f"Filtering by user_id: {user_id} OR public=True")
                query = query.filter(
                    (Universe.user_id == user_id) | (Universe.is_public == True)
                )

            # Execute query
            current_app.logger.debug(f"Final query: {str(query)}")
            universes = query.all()
            current_app.logger.info(f"Found {len(universes)} universes")

            # Format response
            universe_dicts = []
            for universe in universes:
                try:
                    universe_dict = universe.to_dict()
                    universe_dicts.append(universe_dict)
                except Exception as e:
                    current_app.logger.error(f"Error converting universe to dict: {str(e)}")
                    current_app.logger.error(f"Universe ID: {universe.id}")
                    # Skip this universe but continue processing
                    continue
            
            current_app.logger.info(f"Successfully formatted {len(universe_dicts)} universes")
            
            return jsonify({
                'message': 'Universes retrieved successfully',
                'universes': universe_dicts
            }), 200
            
        except Exception as inner_e:
            current_app.logger.error(f"Database error retrieving universes: {str(inner_e)}")
            current_app.logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({
                'message': 'Database error retrieving universes',
                'error': str(inner_e)
            }), 500

    except Exception as e:
        current_app.logger.error(f"Error retrieving universes: {str(e)}")
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        current_app.logger.error(f"Query parameters: public_only={request.args.get('public', 'false')}, user_only={request.args.get('user_only', 'false')}")
        
        return jsonify({
            'message': 'Error retrieving universes',
            'error': str(e)
        }), 500 