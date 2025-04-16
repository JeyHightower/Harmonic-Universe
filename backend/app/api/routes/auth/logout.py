from flask import jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from . import auth_bp
from ....extensions import add_token_to_blocklist
from .token import get_jwt_secret_key
import jwt

@auth_bp.route('/logout/', methods=['POST'])
@jwt_required(optional=True)
def logout():
    """Logout the current user."""
    try:
        # First try the standard way
        try:
            jwt_payload = get_jwt()
            jti = jwt_payload['jti']
        except Exception as e:
            # If that fails, try manual extraction
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                try:
                    secret_key = get_jwt_secret_key()
                    payload = jwt.decode(token, secret_key, algorithms=['HS256'])
                    # We don't have a JTI in manually decoded token, so use token itself
                    jti = token
                except Exception as e:
                    current_app.logger.error(f"Error decoding token manually: {str(e)}")
                    return jsonify({
                        'success': False,
                        'message': 'Invalid token',
                        'status': 401
                    }), 401
            else:
                return jsonify({
                    'success': False,
                    'message': 'No token provided',
                    'status': 401
                }), 401
        
        current_app.logger.info(f'Logging out user, revoking token with JTI: {jti}')
        add_token_to_blocklist(jti)
        
        return jsonify({
            'success': True,
            'message': 'Logout successful',
            'status': 200
        }), 200
    except Exception as e:
        current_app.logger.error(f'Logout error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'An error occurred during logout',
            'error': str(e),
            'status': 500
        }), 500 