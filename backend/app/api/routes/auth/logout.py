from flask import jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from flask_cors import cross_origin

from . import auth_bp
from ....extensions import add_token_to_blocklist
from app.utils.jwt.config import get_jwt_secret_key
import jwt

@auth_bp.route('/logout/', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def logout():
    """Logout the current user."""
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        return current_app.make_default_options_response()

    try:
        # Try to get the JWT token
        auth_header = request.headers.get('Authorization')

        # If there's a token, try to revoke it, but don't require it for logout
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                # Try to decode it
                secret_key = get_jwt_secret_key(None)
                payload = jwt.decode(token, secret_key, algorithms=['HS256'], options={"verify_exp": False})

                # If we have a jti, add it to the blocklist
                if 'jti' in payload:
                    jti = payload['jti']
                    add_token_to_blocklist(jti)
                    current_app.logger.info(f'Revoked token with JTI: {jti}')
                else:
                    # If no jti in payload, use the token itself as key
                    add_token_to_blocklist(token)
                    current_app.logger.info(f'Revoked token (using token as key)')
            except Exception as e:
                # Log but continue - we want logout to succeed even if token is invalid
                current_app.logger.warning(f"Error processing token during logout: {str(e)}")

        # Return success even if we couldn't revoke the token
        return jsonify({
            'success': True,
            'message': 'Logout successful',
            'status': 200
        }), 200
    except Exception as e:
        current_app.logger.error(f'Logout error: {str(e)}')

        # Even on error, we want to tell the client that logout succeeded
        # This ensures the client can clean up its local storage
        return jsonify({
            'success': True,
            'message': 'Logout processed',
            'error': str(e),
            'status': 200
        }), 200
