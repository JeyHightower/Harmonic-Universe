from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt

from . import auth_bp
from ....extensions import add_token_to_blocklist

@auth_bp.route('/logout/', methods=['POST'])
@jwt_required()
def logout():
    """Logout the current user."""
    try:
        # Revoke the token by adding it to the blocklist
        jwt_payload = get_jwt()
        jti = jwt_payload['jti']
        
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