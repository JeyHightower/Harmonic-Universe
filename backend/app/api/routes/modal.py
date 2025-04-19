from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

modal_bp = Blueprint('modal', __name__)

# In-memory storage for modal state
modal_state = {
    'isOpen': False,
    'type': None,
    'props': {},
    'transition': None
}

@modal_bp.route('/open', methods=['POST'])
@modal_bp.route('/open/', methods=['POST'])
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

@modal_bp.route('/props', methods=['PUT'])
@modal_bp.route('/props/', methods=['PUT'])
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

@modal_bp.route('/close', methods=['POST'])
@modal_bp.route('/close/', methods=['POST'])
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

@modal_bp.route('/state', methods=['GET'])
@modal_bp.route('/state/', methods=['GET'])
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
@modal_bp.route('/transition/', methods=['GET'])
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
