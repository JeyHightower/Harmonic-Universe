from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from ...models.universe import Universe
from ....extensions import db, limiter
import traceback
import jwt as pyjwt
import os

from . import universes_bp

def get_debug_jwt_info():
    """Get detailed JWT information for debugging."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return "No Authorization header with Bearer token found"

    token = auth_header.split(' ')[1]

    # Get the secret key being used
    secret_key = current_app.config.get('JWT_SECRET_KEY')
    if not secret_key:
        secret_key = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')

    # Try to decode the token without verification to see its contents
    try:
        unverified_payload = pyjwt.decode(token, options={"verify_signature": False})
        current_app.logger.debug(f"Token payload (unverified): {unverified_payload}")
    except Exception as e:
        current_app.logger.debug(f"Error decoding token: {str(e)}")

    # Try to verify the token properly
    try:
        verified_payload = pyjwt.decode(token, secret_key, algorithms=['HS256'])
        current_app.logger.debug(f"Token successfully verified with secret key")
        return f"Token valid, payload: {verified_payload}"
    except Exception as e:
        current_app.logger.debug(f"Token verification failed: {str(e)}")
        return f"Token invalid: {str(e)}"

@universes_bp.route('/', methods=['GET'])
@limiter.limit("1000 per hour")  # Higher rate limit for universes endpoint
@jwt_required(optional=True)
def get_universes():
    try:
        # Get query parameters
        public_only = request.args.get('public', 'false').lower() == 'true'
        user_only = request.args.get('user_only', 'false').lower() == 'true'

        # Check if this is a demo user request
        is_demo_user = request.headers.get('X-Demo-User') == 'true'

        # Always get user ID from JWT if available
        user_id = get_jwt_identity()

        current_app.logger.info(f"Fetching universes for user {user_id}, public_only: {public_only}, user_only: {user_only}, is_demo: {is_demo_user}")

        try:
            # Build query
            query = Universe.query.filter_by(is_deleted=False)

            current_app.logger.debug(f"Base query: {str(query)}")

            if is_demo_user:
                # For demo users, only show universes created by this demo user
                current_app.logger.debug(f"Demo user detected, filtering by user_id: {user_id}")
                query = query.filter_by(user_id=user_id)
            elif user_id and user_only:
                # Only include user's own universes when user_only is true and user is authenticated
                current_app.logger.debug(f"Filtering by user_id: {user_id}")
                query = query.filter_by(user_id=user_id)
            elif public_only or not user_id:
                # Show only public universes if specifically requested or user is not authenticated
                current_app.logger.debug(f"Filtering by public only")
                query = query.filter_by(is_public=True)
            else:
                # Include user's own universes and public universes when authenticated
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
                universe_dict = universe.to_dict()
                # For demo users, they're never the owner since they don't have a real user_id
                universe_dict['is_owner'] = False if is_demo_user else (universe.user_id == user_id)
                universe_dicts.append(universe_dict)

            return jsonify({
                'message': 'Universes fetched successfully',
                'universes': universe_dicts
            }), 200

        except Exception as e:
            traceback.print_exc()
            current_app.logger.error(f"Database error in get_universes: {str(e)}")
            raise e

    except Exception as e:
        current_app.logger.error(f"Error fetching universes: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'message': 'Error fetching universes',
            'error': str(e)
        }), 500

# Public fallback endpoint for debugging
@universes_bp.route('/public-only/', methods=['GET'])
@limiter.limit("1000 per hour")  # Higher rate limit for public universes endpoint
def get_public_universes():
    """Public endpoint to fetch public universes only without JWT verification."""
    try:
        current_app.logger.info("Fetching public universes (JWT-free endpoint)")

        # Get JWT info for debugging if available
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                # Try to decode without verification
                payload = pyjwt.decode(token, options={"verify_signature": False})
                current_app.logger.debug(f"Token payload (unverified): {payload}")

                # Try to verify with our hardcoded key
                try:
                    secret_key = 'jwt-secret-key'  # The default from config
                    verified_payload = pyjwt.decode(token, secret_key, algorithms=['HS256'])
                    current_app.logger.debug(f"Token verified with default key: {verified_payload}")
                except Exception as e:
                    current_app.logger.debug(f"Token verification failed: {str(e)}")
            except Exception as e:
                current_app.logger.debug(f"Token decode error: {str(e)}")

        # Only fetch public universes
        universes = Universe.query.filter_by(is_deleted=False, is_public=True).all()

        # Prepare response
        universe_dicts = [universe.to_dict() for universe in universes]

        return jsonify({
            'message': 'Public universes fetched successfully',
            'universes': universe_dicts,
            'count': len(universe_dicts)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching public universes: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'message': 'Error fetching public universes',
            'error': str(e)
        }), 500
