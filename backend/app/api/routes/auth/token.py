from flask import request, jsonify, current_app # type: ignore
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token # type: ignore
from ...models.user import User
# Removed unused import

import jwt
import os
# Removed unused imports

from . import auth_bp
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import current_app

# Function to get the JWT secret key consistently
def get_jwt_secret_key():
    """Get the JWT secret key from config or environment variables."""
    secret_key = current_app.config.get('JWT_SECRET_KEY')
    if not secret_key:
        secret_key = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
        # Store it in config for consistency
        current_app.config['JWT_SECRET_KEY'] = secret_key
    return secret_key

# Note: This route can be rate-limited by Flask-Limiter and cause 429 errors
# if too many requests occur in a short time frame. The frontend should handle
# this by implementing backoff and retry logic.
@auth_bp.route('/validate/', methods=['POST', 'OPTIONS'])
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
            secret_key = get_jwt_secret_key()
            current_app.logger.debug(f"Using JWT secret key for validation (first 3 chars): {secret_key[:3]}...")

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
@auth_bp.route('/refresh/', methods=['POST', 'GET', 'OPTIONS'])
def refresh_token():
    """Refresh an expired JWT token."""
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        # Create a response with CORS headers
        response = current_app.make_default_options_response()
        
        # Add CORS headers
        origin = request.headers.get('Origin')
        cors_origins = current_app.config.get('CORS_ORIGINS', ['*'])
        
        if origin and (origin in cors_origins or '*' in cors_origins):
            response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Access-Control-Allow-Headers', 
                               ','.join(current_app.config.get('CORS_HEADERS', 
                                      ['Content-Type', 'Authorization', 'Accept'])))
            response.headers.add('Access-Control-Allow-Methods',
                               ','.join(current_app.config.get('CORS_METHODS',
                                      ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])))
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            response.headers.add('Access-Control-Max-Age', 
                               str(current_app.config.get('CORS_MAX_AGE', 86400)))
        
        return response, 200
        
    # Print request details for debugging
    current_app.logger.debug(f"Token refresh request: Method={request.method}, Headers={dict(request.headers)}, Origin={request.headers.get('Origin')}")
    current_app.logger.debug(f"Request args: {request.args}, Form: {request.form}, JSON: {request.get_json(silent=True)}")
    
    try:
        # Get token from request
        token = None
        refresh_token = None
        
        # Try to get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        # Try to get refresh token from request body
        if request.is_json:
            data = request.get_json()
            refresh_token = data.get('refresh_token')
        else:
            refresh_token = request.form.get('refresh_token')
        
        # If no token in header, try to get from request body
        if not token and request.is_json:
            data = request.get_json()
            token = data.get('token')
        elif not token:
            token = request.form.get('token')
        
        # If we have a refresh token, use it
        if refresh_token:
            current_app.logger.debug("Using refresh token for refresh")
            # Validate refresh token
            try:
                secret_key = get_jwt_secret_key()
                current_app.logger.debug(f"Using JWT secret key for refresh (first 3 chars): {secret_key[:3]}...")
                
                # Verify the refresh token
                payload = jwt.decode(refresh_token, secret_key, algorithms=['HS256'])
                user_id = payload.get('sub')
                
                if not user_id:
                    current_app.logger.error('Refresh token missing user ID')
                    return jsonify({'message': 'Invalid refresh token'}), 401
                
                # Convert user_id to int if it's a string (since DB expects integers for IDs)
                try:
                    if isinstance(user_id, str) and user_id.isdigit():
                        user_id = int(user_id)
                except Exception as e:
                    current_app.logger.error(f'Error converting user_id to int: {str(e)}')
                    # Continue with the original value
                
                # Get user
                user = User.query.get(user_id)
                if not user:
                    current_app.logger.error(f'User not found for refresh token: {user_id}')
                    return jsonify({'message': 'User not found'}), 404
                
                # Create new token
                new_token = create_access_token(identity=user.id)
                
                # Create response
                response = jsonify({
                    'message': 'Token refreshed successfully',
                    'token': new_token,
                    'user': user.to_dict()
                })
                
                # Set cookie for token
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
                
            except jwt.ExpiredSignatureError:
                current_app.logger.info("Refresh token has expired")
                return jsonify({'message': 'Refresh token has expired'}), 401
                
            except jwt.InvalidTokenError as e:
                current_app.logger.error(f'Invalid refresh token: {str(e)}')
                return jsonify({'message': 'Invalid refresh token'}), 401
                
        # If we have a main token, try to refresh it
        elif token:
            current_app.logger.debug("Using main token for refresh")
            try:
                secret_key = get_jwt_secret_key()
                current_app.logger.debug(f"Using JWT secret key for refresh (first 3 chars): {secret_key[:3]}...")
                
                # Verify the token
                payload = jwt.decode(token, secret_key, algorithms=['HS256'])
                user_id = payload.get('sub')
                
                if not user_id:
                    current_app.logger.error('Token missing user ID')
                    return jsonify({'message': 'Invalid token'}), 401
                
                # Convert user_id to int if it's a string (since DB expects integers for IDs)
                try:
                    if isinstance(user_id, str) and user_id.isdigit():
                        user_id = int(user_id)
                except Exception as e:
                    current_app.logger.error(f'Error converting user_id to int: {str(e)}')
                    # Continue with the original value
                
                # Get user
                user = User.query.get(user_id)
                if not user:
                    current_app.logger.error(f'User not found for token: {user_id}')
                    return jsonify({'message': 'User not found'}), 404
                
                # Create new token
                new_token = create_access_token(identity=user.id)
                
                # Create response
                response = jsonify({
                    'message': 'Token refreshed successfully',
                    'token': new_token,
                    'user': user.to_dict()
                })
                
                # Set cookie for token
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
                
            except jwt.ExpiredSignatureError:
                current_app.logger.info("Token has expired")
                return jsonify({'message': 'Token has expired'}), 401
                
            except jwt.InvalidTokenError as e:
                current_app.logger.error(f'Invalid token: {str(e)}')
                return jsonify({'message': 'Invalid token'}), 401
                
        else:
            current_app.logger.warning("No token provided for refresh")
            return jsonify({'message': 'No token provided'}), 401
            
    except Exception as e:
        current_app.logger.error(f'Token refresh error: {str(e)}')
        return jsonify({
            'message': 'An error occurred during token refresh',
            'error': str(e)
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
                    secret_key = get_jwt_secret_key()
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
