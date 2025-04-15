from flask import request, jsonify, current_app # type: ignore
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token # type: ignore
from ...models.user import User
# Removed unused import

import jwt
import os
# Removed unused imports

from . import auth_bp

# Note: This route can be rate-limited by Flask-Limiter and cause 429 errors
# if too many requests occur in a short time frame. The frontend should handle
# this by implementing backoff and retry logic.
@auth_bp.route('/validate', methods=['POST', 'OPTIONS'])
def validate_token():
    """Validate the JWT token and return user data."""
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        # Let Flask-CORS handle the OPTIONS response
        return current_app.make_default_options_response()

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

            # Set cookie with the token for better client handling
            response = jsonify({
                'message': 'Token is valid',
                'valid': True,
                'user': user.to_dict()
            })
            
            # Set the token as a cookie with secure settings
            is_production = current_app.config.get('ENV') == 'production'
            same_site = 'None'  # Use None to enable cross-site cookies for both prod and dev
            secure = True  # Must be secure if SameSite=None
            
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
            return jsonify({'message': 'Token has expired', 'valid': False, 'expired': True}), 401
            
        except jwt.InvalidTokenError as e:
            current_app.logger.error(f'Invalid token during validation: {str(e)}')
            return jsonify({'message': 'Signature verification failed', 'valid': False, 'error': str(e)}), 401
            
    except Exception as e:
        current_app.logger.error(f'Token validation error: {str(e)}')
        return jsonify({'message': 'An error occurred during token validation', 'valid': False, 'error': str(e)}), 500

# Note: This route can be rate-limited by Flask-Limiter and cause 429 errors
# if too many requests occur in a short time frame. The frontend should handle
# this by implementing backoff and retry logic.
@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refresh an expired JWT token."""
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        # Let Flask-CORS handle the OPTIONS response
        return current_app.make_default_options_response()
        
    # Print request details for debugging
    current_app.logger.debug(f"Token refresh request: Headers={dict(request.headers)}, Origin={request.headers.get('Origin')}")
    
    try:
        # Get the token from the request
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            current_app.logger.debug("Found token in Authorization header")

        # Check for token in cookies too
        if not token:
            token = request.cookies.get('token')
            if token:
                current_app.logger.debug("Found token in cookies")

        # If still no token, check request JSON
        if not token:
            try:
                data = request.get_json(silent=True) or {}
                if 'token' in data:
                    token = data['token']
                    current_app.logger.debug("Found token in JSON body")
                elif 'refresh_token' in data:
                    token = data['refresh_token']
                    current_app.logger.debug("Found refresh_token in JSON body")
            except Exception as e:
                current_app.logger.error(f'Error parsing JSON data: {str(e)}')

        # Check form data as a fallback
        if not token and request.form:
            token = request.form.get('token') or request.form.get('refresh_token')
            if token:
                current_app.logger.debug("Found token in form data")

        if not token:
            current_app.logger.warning('No token provided in refresh request')
            return jsonify({
                'success': False,
                'message': 'No token provided',
                'status': 401
            }), 401

        # Log token format for debugging
        if token:
            token_parts = token.split('.')
            current_app.logger.debug(f'Token parts count: {len(token_parts)}')
            if len(token_parts) != 3:
                current_app.logger.warning(f'Malformed token - expected 3 parts, got {len(token_parts)}')
                return jsonify({
                    'success': False,
                    'message': 'Malformed token',
                    'status': 401
                }), 401

        try:
            # Try to decode the token to get the user ID
            # Even though it's expired, we can still get the user ID if the signature is valid
            secret_key = current_app.config.get('JWT_SECRET_KEY') or os.environ.get('JWT_SECRET_KEY')

            if not secret_key:
                current_app.logger.error('JWT_SECRET_KEY not configured')
                return jsonify({
                    'success': False,
                    'message': 'Server configuration error',
                    'status': 500
                }), 500

            # Allow ExpiredSignatureError but catch other errors
            try:
                # Log JWT secret key length for debugging (never log the actual key)
                current_app.logger.debug(f'JWT secret key length: {len(secret_key)}')
                
                # Do not verify expiration when refreshing
                payload = jwt.decode(token, secret_key, algorithms=['HS256'], options={'verify_exp': False})
                user_id = payload.get('sub')  # 'sub' is where Flask-JWT-Extended stores the identity
                jti = payload.get('jti')  # JWT ID
                
                # Check if token has been revoked
                from ....extensions import token_blocklist
                if jti in token_blocklist:
                    current_app.logger.warning(f'Attempt to use revoked token: {jti}')
                    return jsonify({
                        'success': False,
                        'message': 'Token has been revoked',
                        'status': 401,
                        'error': 'token_revoked'
                    }), 401
                
                current_app.logger.debug(f'Successfully decoded token for user ID: {user_id}')
            except jwt.InvalidTokenError as e:
                current_app.logger.error(f'Invalid token during refresh: {str(e)}')
                return jsonify({
                    'success': False,
                    'message': 'Invalid token',
                    'error': str(e),
                    'status': 401
                }), 401

            if not user_id:
                current_app.logger.error('Token missing user ID in payload')
                return jsonify({
                    'success': False,
                    'message': 'Invalid token payload - missing user ID',
                    'status': 401
                }), 401

            # Verify the user exists
            user = User.query.get(user_id)
            if not user:
                current_app.logger.error(f'User not found for ID: {user_id}')
                return jsonify({
                    'success': False,
                    'message': 'User not found',
                    'status': 404
                }), 404

            # Create a new token with the new JTI (ensuring old token can be invalidated)
            new_token = create_access_token(identity=user.id)
            
            # If we're using refresh tokens, we might want to revoke the old one
            if jti:
                # Add to blocklist if needed
                # from ....extensions import add_token_to_blocklist
                # add_token_to_blocklist(jti)
                pass
                
            current_app.logger.info(f'Created new token for user ID: {user.id}')

            # Create response
            response = jsonify({
                'success': True,
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
            return jsonify({
                'success': False,
                'message': 'Invalid token format',
                'error': str(decode_error),
                'status': 401
            }), 401

    except Exception as e:
        current_app.logger.error(f'Token refresh error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'An error occurred during token refresh',
            'error': str(e),
            'status': 500
        }), 500
