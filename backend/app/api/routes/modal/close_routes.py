from flask import jsonify
from flask_jwt_extended import jwt_required

from . import modal_bp, modal_state

@modal_bp.route('/close', methods=['POST'])
@jwt_required()
def close_modal():
    """Close the current modal."""
    try:
        if not modal_state['isOpen']:
            return jsonify({
                'message': 'No modal is currently open'
            }), 400
            
        modal_state['isOpen'] = False
        modal_state['type'] = None
        modal_state['props'] = {}
        modal_state['transition'] = 'CLOSING'
        
        return jsonify({
            'message': 'Modal closed successfully',
            'modal': modal_state
        }), 200
        
    except Exception as e:
        return jsonify({
            'message': 'Error closing modal',
            'error': str(e)
        }), 500 