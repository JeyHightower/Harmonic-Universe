from flask import request, jsonify, current_app # type: ignore
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token # type: ignore
from ...models.user import User
# Removed unused import

import jwt
import os
# Removed unused imports

from . import auth_bp
@auth_bp.route('/validate', methods=['POST'])
@jwt_required()
def validate_token():
    """Validate the JWT token and return user data."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'message': 'User not found'}), 404

        return jsonify({
            'message': 'Token is valid',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Token validation error: {str(e)}')
        return jsonify({'message': 'An error occurred during token validation'}), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refresh an expired JWT token."""
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
                data = request.get_json()
                if data and 'token' in data:
                    token = data['token']
            except:
                pass

        if not token:
            return jsonify({'message': 'No token provided'}), 401

        try:
            # Try to decode the token to get the user ID
            # Even though it's expired, we can still get the user ID if the signature is valid
            secret_key = current_app.config.get('JWT_SECRET_KEY') or os.environ.get('JWT_SECRET_KEY')

            if not secret_key:
                current_app.logger.error('JWT_SECRET_KEY not configured')
                return jsonify({'message': 'Server configuration error'}), 500

            # Allow ExpiredSignatureError but catch other errors
            try:
                payload = jwt.decode(token, secret_key, algorithms=['HS256'], options={'verify_exp': False})
                user_id = payload.get('sub')  # 'sub' is where Flask-JWT-Extended stores the identity
            except jwt.InvalidTokenError as e:
                current_app.logger.error(f'Invalid token: {str(e)}')
                return jsonify({'message': 'Invalid token'}), 401

            if not user_id:
                return jsonify({'message': 'Invalid token payload'}), 401

            # Verify the user exists
            user = User.query.get(user_id)
            if not user:
                return jsonify({'message': 'User not found'}), 404

            # Create a new token
            new_token = create_access_token(identity=user.id)

            # Create response
            response = jsonify({
                'message': 'Token refreshed successfully',
                'token': new_token,
                'user': user.to_dict()
            })

            # Set the new token as a cookie as well
            is_production = current_app.config.get('ENV') == 'production'
            cookie_domain = None  # Let browser set domain automatically
            same_site = 'None' if is_production else 'Lax'
            secure = is_production

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
                domain=cookie_domain
            )

            return response, 200

        except Exception as decode_error:
            current_app.logger.error(f'Token decode error: {str(decode_error)}')
            return jsonify({'message': 'Invalid token format'}), 401

    except Exception as e:
        current_app.logger.error(f'Token refresh error: {str(e)}')
        return jsonify({'message': 'An error occurred during token refresh'}), 500
