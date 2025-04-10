from flask import jsonify
from flask_jwt_extended import jwt_required

from . import modal_bp, modal_state

@modal_bp.route('/state', methods=['GET'])
@jwt_required()
def get_modal_state():
    """Get the current modal state."""
    try:
        return jsonify({
            'modal': modal_state
        }), 200
        
    except Exception as e:
        return jsonify({
            'message': 'Error getting modal state',
            'error': str(e)
        }), 500

@modal_bp.route('/transition', methods=['GET'])
@jwt_required()
def get_modal_transition():
    """Get the current modal transition state."""
    try:
        return jsonify({
            'transition': modal_state['transition']
        }), 200
        
    except Exception as e:
        return jsonify({
            'message': 'Error getting modal transition state',
            'error': str(e)
        }), 500 