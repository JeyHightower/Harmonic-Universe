from flask import request, jsonify, current_app # type: ignore
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token # type: ignore
from ...models.user import User
# Removed unused import

import jwt
import os
# Removed unused imports

from . import auth_bp
@auth_bp.route('/validate', methods=['POST', 'OPTIONS'])
def validate_token():
    """Validate the JWT token and return user data."""
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        response = current_app.make_default_options_response()
        # Add necessary CORS headers
        origin = request.headers.get('Origin')
        if origin:
            response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            response.headers.add('Access-Control-Max-Age', '3600')
        return response

    # Print request details for debugging
    current_app.logger.debug(f"Token validate request: Headers={dict(request.headers)}, Origin={request.headers.get('Origin')}")

    try:
        # Get the token from the request
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        # Check for token in cookies too
        if not token:
            token = request.cookies.get('token')

        # Check JSON data as fallback
        if not token:
            try:
                data = request.get_json(silent=True) or {}
                if 'token' in data:
                    token = data['token']
            except Exception as e:
                current_app.logger.error(f'Error parsing JSON in validate: {str(e)}')

        if not token:
            current_app.logger.warning("No token provided for validation")
            return jsonify({'message': 'No token provided', 'valid': False}), 401

        # Validate token
        try:
            secret_key = current_app.config.get('JWT_SECRET_KEY') or os.environ.get('JWT_SECRET_KEY')
            if not secret_key:
                current_app.logger.error('JWT_SECRET_KEY not configured')
                return jsonify({'message': 'Server configuration error', 'valid': False}), 500

            # Log token format for debugging
            token_parts = token.split('.')
            current_app.logger.debug(f'Token parts count: {len(token_parts)}')
            if len(token_parts) != 3:
                current_app.logger.warning(f'Malformed token - expected 3 parts, got {len(token_parts)}')

            # Verify the token (including expiration)
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            user_id = payload.get('sub')  # 'sub' is where Flask-JWT-Extended stores the identity
            
            if not user_id:
                current_app.logger.error('Token missing user ID in payload')
                return jsonify({'message': 'Invalid token payload', 'valid': False}), 401

            user = User.query.get(user_id)
            if not user:
                current_app.logger.error(f'User not found for ID: {user_id}')
                return jsonify({'message': 'User not found', 'valid': False}), 404

            return jsonify({
                'message': 'Token is valid',
                'valid': True,
                'user': user.to_dict()
            }), 200
            
        except jwt.ExpiredSignatureError:
            current_app.logger.info("Token has expired during validation")
            return jsonify({'message': 'Token has expired', 'valid': False, 'expired': True}), 401
            
        except jwt.InvalidTokenError as e:
            current_app.logger.error(f'Invalid token during validation: {str(e)}')
            return jsonify({'message': 'Signature verification failed', 'valid': False, 'error': str(e)}), 401
            
    except Exception as e:
        current_app.logger.error(f'Token validation error: {str(e)}')
        return jsonify({'message': 'An error occurred during token validation', 'valid': False, 'error': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refresh an expired JWT token."""
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        response = current_app.make_default_options_response()
        # Add necessary CORS headers
        origin = request.headers.get('Origin')
        if origin:
            response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            response.headers.add('Access-Control-Max-Age', '3600')
        return response
        
    # Print request details for debugging
    current_app.logger.debug(f"Token refresh request: Headers={dict(request.headers)}, Origin={request.headers.get('Origin')}")
        
    try:
        # Get the token from the request
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        # Check for token in cookies too
        if not token:
            token = request.cookies.get('token')

        # If still no token, check request JSON
        if not token:
            try:
                data = request.get_json(silent=True) or {}
                if 'token' in data:
                    token = data['token']
            except Exception as e:
                current_app.logger.error(f'Error parsing JSON data: {str(e)}')

        # Check form data as a fallback
        if not token and request.form:
            token = request.form.get('token')

        if not token:
            current_app.logger.warning('No token provided in refresh request')
            return jsonify({'message': 'No token provided'}), 401

        # Log token format for debugging
        if token:
            token_parts = token.split('.')
            current_app.logger.debug(f'Token parts count: {len(token_parts)}')
            if len(token_parts) != 3:
                current_app.logger.warning(f'Malformed token - expected 3 parts, got {len(token_parts)}')

        try:
            # Try to decode the token to get the user ID
            # Even though it's expired, we can still get the user ID if the signature is valid
            secret_key = current_app.config.get('JWT_SECRET_KEY') or os.environ.get('JWT_SECRET_KEY')

            if not secret_key:
                current_app.logger.error('JWT_SECRET_KEY not configured')
                return jsonify({'message': 'Server configuration error'}), 500

            # Allow ExpiredSignatureError but catch other errors
            try:
                # Log JWT secret key length for debugging (never log the actual key)
                current_app.logger.debug(f'JWT secret key length: {len(secret_key)}')
                
                # Do not verify expiration when refreshing
                payload = jwt.decode(token, secret_key, algorithms=['HS256'], options={'verify_exp': False})
                user_id = payload.get('sub')  # 'sub' is where Flask-JWT-Extended stores the identity
                current_app.logger.debug(f'Successfully decoded token for user ID: {user_id}')
            except jwt.InvalidTokenError as e:
                current_app.logger.error(f'Invalid token during refresh: {str(e)}')
                return jsonify({'message': 'Invalid token', 'error': str(e)}), 401

            if not user_id:
                current_app.logger.error('Token missing user ID in payload')
                return jsonify({'message': 'Invalid token payload - missing user ID'}), 401

            # Verify the user exists
            user = User.query.get(user_id)
            if not user:
                current_app.logger.error(f'User not found for ID: {user_id}')
                return jsonify({'message': 'User not found'}), 404

            # Create a new token
            new_token = create_access_token(identity=user.id)
            current_app.logger.info(f'Created new token for user ID: {user.id}')

            # Create response
            response = jsonify({
                'message': 'Token refreshed successfully',
                'token': new_token,
                'user': user.to_dict()
            })

            # Set the new token as a cookie as well
            is_production = current_app.config.get('ENV') == 'production'
            cookie_domain = None  # Let browser set domain automatically
            same_site = 'None'  # Use None to enable cross-site cookies for both prod and dev
            secure = is_production or same_site == 'None'  # Must be secure if SameSite=None

            # Get token expiration time or default to 24 hours
            token_expires = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES')
            max_age = token_expires.total_seconds() if token_expires else 24 * 60 * 60  # 24 hours default

            response.set_cookie(
                'token',
                new_token,
                httponly=True,
                secure=secure,
                samesite=same_site,
                max_age=max_age,
                domain=cookie_domain,
                path='/'  # Ensure cookie is available for all paths
            )

            return response, 200

        except Exception as decode_error:
            current_app.logger.error(f'Token decode error: {str(decode_error)}')
            return jsonify({'message': 'Invalid token format', 'error': str(decode_error)}), 401

    except Exception as e:
        current_app.logger.error(f'Token refresh error: {str(e)}')
        return jsonify({'message': 'An error occurred during token refresh', 'error': str(e)}), 500
