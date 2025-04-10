from flask import jsonify, request
from flask_jwt_extended import jwt_required

from . import modal_bp, modal_state

@modal_bp.route('/open', methods=['POST'])
@jwt_required()
def open_modal():
    """Open a new modal with specified type and props."""
    try:
        data = request.get_json()
        
        if not data or 'type' not in data:
            return jsonify({
                'message': 'Modal type is required'
            }), 400
            
        modal_state['isOpen'] = True
        modal_state['type'] = data['type']
        modal_state['props'] = data.get('props', {})
        modal_state['transition'] = 'OPENING'
        
        return jsonify({
            'message': 'Modal opened successfully',
            'modal': modal_state
        }), 200
        
    except Exception as e:
        return jsonify({
            'message': 'Error opening modal',
            'error': str(e)
        }), 500 