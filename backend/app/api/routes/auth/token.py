from flask import request, jsonify, current_app, make_response # type: ignore
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token # type: ignore
from ...models.user import User
import logging
# Removed unused import

import jwt
import os
# Removed unused imports

from . import auth_bp
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import current_app
from app.utils.jwt.config import get_jwt_secret_key, get_jwt_refresh_secret_key
from flask_cors import cross_origin
from app.extensions import limiter
from datetime import datetime, timedelta, timezone

from app.utils.jwt.core import (
    decode_token_without_verification,
    verify_token_signature,
    create_token,
    is_token_expired,
    decode_token
)

# Logger setup
logger = logging.getLogger(__name__)

# Note: This route can be rate-limited by Flask-Limiter and cause 429 errors
# if too many requests occur in a short time frame. The frontend should handle
# this by implementing backoff and retry logic.
@auth_bp.route('/validate/', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)  # Add explicit cross_origin decorator
def validate_token():
    """Validate the JWT token and return user data."""
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        response = current_app.make_default_options_response()
        # Ensure proper CORS headers for preflight
        origin = request.headers.get('Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        # Ensure only one Access-Control-Allow-Credentials header
        if 'Access-Control-Allow-Credentials' in response.headers:
            del response.headers['Access-Control-Allow-Credentials']
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '86400')
        return response

    # Print request details for debugging
    current_app.logger.debug(f"Token validate request: Headers={dict(request.headers)}, Origin={request.headers.get('Origin')}")
    current_app.logger.debug(f"Request content type: {request.content_type}, method: {request.method}")

    try:
        # Get the token from the request
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            current_app.logger.debug(f"Found token in Authorization header")

        # Check for token in cookies too
        if not token:
            token = request.cookies.get('token')
            if token:
                current_app.logger.debug(f"Found token in cookies")

        # Check JSON data as fallback
        if not token:
            try:
                # Try to parse as JSON first
                if request.is_json:
                    data = request.get_json(silent=True) or {}
                    if 'token' in data:
                        token = data['token']
                        current_app.logger.debug(f"Found token in JSON body")
                # If not JSON, try form data
                elif request.form:
                    token = request.form.get('token')
                    if token:
                        current_app.logger.debug(f"Found token in form data")
                # Finally, try raw data as JSON if content type is not specified correctly
                elif request.data:
                    try:
                        import json
                        data = json.loads(request.data.decode('utf-8'))
                        if 'token' in data:
                            token = data['token']
                            current_app.logger.debug(f"Found token in raw request data")
                    except:
                        current_app.logger.debug("Failed to parse raw data as JSON")
            except Exception as e:
                current_app.logger.error(f'Error parsing request data in validate: {str(e)}')

        if not token:
            current_app.logger.warning("No token provided for validation")
            return jsonify({
                'message': 'No token provided',
                'valid': False
            }), 401

        # Validate token
        try:
            # First check token type without verification
            unverified_payload = decode_token_without_verification(token)
            token_type = unverified_payload.get('type', 'access')

            # Choose appropriate secret key based on token type
            if token_type == 'refresh':
                secret_key = get_jwt_refresh_secret_key()
                current_app.logger.debug(f"Using JWT refresh secret key for validation (first 3 chars): {secret_key[:3]}...")
            else:
                secret_key = get_jwt_secret_key()
                current_app.logger.debug(f"Using JWT access secret key for validation (first 3 chars): {secret_key[:3]}...")

            # Log token format for debugging
            token_parts = token.split('.')
            current_app.logger.debug(f'Token parts count: {len(token_parts)}')
            if len(token_parts) != 3:
                current_app.logger.warning(f'Malformed token - expected 3 parts, got {len(token_parts)}')
                return jsonify({
                    'message': 'Malformed token format',
                    'valid': False
                }), 401

            # Use decode_token utility function instead of direct jwt.decode
            payload = decode_token(token, secret_key)
            user_id = payload.get('sub')  # 'sub' is where Flask-JWT-Extended stores the identity

            if not user_id:
                current_app.logger.error('Token missing user ID in payload')
                return jsonify({
                    'message': 'Invalid token payload',
                    'valid': False
                }), 401

            # Convert user_id to int if it's a string (since DB expects integers for IDs)
            try:
                if isinstance(user_id, str) and user_id.isdigit():
                    user_id = int(user_id)
            except Exception as e:
                current_app.logger.error(f'Error converting user_id to int: {str(e)}')
                # Continue with the original value

            user = User.query.get(user_id)
            if not user:
                current_app.logger.error(f'User not found for ID: {user_id}')
                return jsonify({
                    'message': 'User not found',
                    'valid': False
                }), 404

            # Set cookie with the token for better client handling
            response = jsonify({
                'message': 'Token is valid',
                'valid': True,
                'user': user.to_dict()
            })

            # Ensure CORS headers are properly set
            origin = request.headers.get('Origin')
            if origin:
                response.headers.add('Access-Control-Allow-Origin', origin)
                # Ensure only one Access-Control-Allow-Credentials header
                if 'Access-Control-Allow-Credentials' in response.headers:
                    del response.headers['Access-Control-Allow-Credentials']
                response.headers.add('Access-Control-Allow-Credentials', 'true')

            # Set the token as a cookie with secure settings
            is_production = current_app.config.get('ENV') == 'production'
            same_site = 'Lax'  # 'None' works for cross-site but requires secure=True which may not work in development
            secure = is_production  # Only require secure in production

            # Only set cookie if not in development mode with localhost
            origin = request.headers.get('Origin', '')
            if is_production or 'localhost' not in origin:
                response.set_cookie(
                    'token',
                    token,
                    httponly=True,
                    secure=secure,
                    samesite=same_site,
                    max_age=24 * 60 * 60,  # 24 hours
                    path='/'  # Ensure cookie is available for all paths
                )

            return response, 200

        except jwt.ExpiredSignatureError:
            current_app.logger.info("Token has expired during validation")
            return jsonify({
                'message': 'Token has expired',
                'valid': False,
                'expired': True
            }), 401

        except jwt.InvalidTokenError as e:
            current_app.logger.error(f'Invalid token during validation: {str(e)}')
            return jsonify({
                'message': 'Signature verification failed',
                'valid': False,
                'error': str(e)
            }), 401

    except Exception as e:
        current_app.logger.error(f'Token validation error: {str(e)}')
        return jsonify({
            'message': 'An error occurred during token validation',
            'valid': False,
            'error': str(e)
        }), 500

# Helper functions for token operations
def get_token_from_request():
    """
    Extract the access token from the request in the following order:
    1. Authorization header (Bearer token)
    2. Cookies ('access_token')
    3. JSON body ('access_token')
    4. Form data ('access_token')
    5. Query parameters ('access_token')

    Returns:
        str or None: The access token if found, None otherwise
    """
    # Check Authorization header
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]

    # Check cookies
    token = request.cookies.get('access_token')
    if token:
        return token

    # Check JSON body
    if request.is_json:
        json_data = request.get_json(silent=True)
        if json_data and 'access_token' in json_data:
            return json_data.get('access_token')

    # Check form data
    token = request.form.get('access_token')
    if token:
        return token

    # Check query parameters
    token = request.args.get('access_token')
    if token:
        return token

    return None

def get_refresh_token_from_request():
    """
    Extract the refresh token from the request in the following order:
    1. Cookies ('refresh_token')
    2. JSON body ('refresh_token')
    3. Form data ('refresh_token')
    4. Query parameters ('refresh_token')

    Returns:
        str or None: The refresh token if found, None otherwise
    """
    # Check cookies
    token = request.cookies.get('refresh_token')
    if token:
        return token

    # Check JSON body
    if request.is_json:
        json_data = request.get_json(silent=True)
        if json_data and 'refresh_token' in json_data:
            return json_data.get('refresh_token')

    # Check form data
    token = request.form.get('refresh_token')
    if token:
        return token

    # Check query parameters
    token = request.args.get('refresh_token')
    if token:
        return token

    return None

# Token refresh route
@auth_bp.route('/refresh', methods=['POST'])
@auth_bp.route('/refresh/', methods=['POST'])
@cross_origin(supports_credentials=True)
def refresh():
    """
    Endpoint to refresh the access token using a valid refresh token.

    Returns:
        Response: A JSON response with the new access token or an error message.
    """
    try:
        refresh_token = get_refresh_token_from_request()

        if not refresh_token:
            logger.warning("Refresh token missing from request")
            return jsonify({
                'success': False,
                'message': 'Refresh token is required'
            }), 400

        # First decode without verification to check claims and expiration
        try:
            unverified_payload = decode_token_without_verification(refresh_token)

            # Check if it's a refresh token
            token_type = unverified_payload.get('type')
            if token_type != 'refresh':
                logger.warning(f"Invalid token type for refresh: {token_type}")
                return jsonify({
                    'success': False,
                    'message': 'Invalid token type'
                }), 401

            # Check if token is expired
            if is_token_expired(refresh_token):
                logger.warning("Refresh token has expired")
                return jsonify({
                    'success': False,
                    'message': 'Refresh token has expired'
                }), 401

            # Get refresh token secret key
            refresh_secret_key = get_jwt_refresh_secret_key()

            # Verify token signature
            if not verify_token_signature(refresh_token, refresh_secret_key):
                logger.warning("Refresh token signature verification failed")
                return jsonify({
                    'success': False,
                    'message': 'Invalid refresh token'
                }), 401

            # Get fully verified payload
            payload = decode_token(refresh_token, refresh_secret_key)

            # Create new access token
            user_id = payload.get('sub')

            if not user_id:
                logger.error("User ID missing in refresh token payload")
                return jsonify({
                    'success': False,
                    'message': 'Invalid token payload'
                }), 401

            # Create new access token
            access_token_payload = {
                'sub': user_id,
                'type': 'access',
                'iat': datetime.now(timezone.utc)
            }

            access_secret_key = get_jwt_secret_key()
            access_token = create_token(
                payload=access_token_payload,
                secret_key=access_secret_key,
                expires_delta=timedelta(minutes=30)
            )

            # Create response
            response = make_response(jsonify({
                'success': True,
                'message': 'Token refreshed successfully',
                'access_token': access_token
            }))

            # Set cookies for cookie-based auth
            max_age = 30 * 60  # 30 minutes in seconds
            response.set_cookie(
                'access_token',
                access_token,
                max_age=max_age,
                httponly=True,
                secure=current_app.config.get('JWT_COOKIE_SECURE', False),
                samesite=current_app.config.get('JWT_COOKIE_SAMESITE', 'Lax')
            )

            return response
        except Exception as e:
            logger.error(f"Error processing refresh token: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Error processing refresh token'
            }), 400

    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid refresh token: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Invalid refresh token'
        }), 401
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'An error occurred while refreshing the token'
        }), 500

@auth_bp.route('/me/', methods=['GET'])
@jwt_required(optional=True)  # Make JWT optional so we can handle errors better
def get_current_user():
    """Get current user information."""
    try:
        # First try using Flask-JWT-Extended's method
        user_id = get_jwt_identity()

        # If that fails, try to get the token manually from the Authorization header
        if not user_id:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                try:
                    secret_key = get_jwt_secret_key(None)
                    payload = jwt.decode(token, secret_key, algorithms=['HS256'])
                    user_id = payload.get('sub')
                    if isinstance(user_id, str) and user_id.isdigit():
                        user_id = int(user_id)
                except Exception as e:
                    current_app.logger.error(f"Error decoding token manually: {str(e)}")

        if not user_id:
            return jsonify({"message": "Authentication required"}), 401

        user = User.query.get(user_id)

        if not user:
            return jsonify({"message": "User not found"}), 404

        return jsonify({
            "user": user.to_dict(),
            "message": "Current user retrieved successfully"
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving current user: {str(e)}")
        return jsonify({"message": "An error occurred retrieving the current user"}), 500

# Debug endpoint to verify JWT identity
@auth_bp.route('/debug/jwt-identity', methods=['GET'])
@auth_bp.route('/debug/jwt-identity/', methods=['GET'])
@jwt_required()
def debug_jwt_identity():
    # Get JWT identity
    user_id = get_jwt_identity()

    # Get user details
    try:
        user = User.query.get(user_id)
        user_data = user.to_dict() if user else None
    except Exception as e:
        user_data = {"error": str(e)}

    # Return debug info
    return jsonify({
        'jwt_identity': user_id,
        'identity_type': type(user_id).__name__,
        'user_data': user_data
    }), 200
