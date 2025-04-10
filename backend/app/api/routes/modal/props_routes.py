from flask import jsonify, request
from flask_jwt_extended import jwt_required

from . import modal_bp, modal_state

@modal_bp.route('/props', methods=['PUT'])
@jwt_required()
def update_modal_props():
    """Update the current modal's properties."""
    try:
        if not modal_state['isOpen']:
            return jsonify({
                'message': 'No modal is currently open'
            }), 400
            
        data = request.get_json()
        if not data:
            return jsonify({
                'message': 'No properties provided'
            }), 400
            
        modal_state['props'].update(data)
        
        return jsonify({
            'message': 'Modal properties updated successfully',
            'modal': modal_state
        }), 200
        
    except Exception as e:
        return jsonify({
            'message': 'Error updating modal properties',
            'error': str(e)
        }), 500 