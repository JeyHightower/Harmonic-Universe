from flask import jsonify, current_app
from flask_jwt_extended import jwt_required

from . import auth_bp

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout the current user."""
    try:
        # In JWT, we don't need to do anything server-side
        # The client should remove the token
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        current_app.logger.error(f'Logout error: {str(e)}')
        return jsonify({'message': 'An error occurred during logout'}), 500 