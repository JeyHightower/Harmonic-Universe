from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Universe
from ....extensions import db
import traceback

from . import universes_bp

@universes_bp.route('/<int:universe_id>/repair', methods=['POST'])
@jwt_required()
def repair_universe(universe_id):
    try:
        current_app.logger.info(f"Initiating repair for universe ID: {universe_id}")
        
        # First check if universe exists
        universe = Universe.query.get(universe_id)
        if not universe:
            current_app.logger.warning(f"Universe not found for repair: {universe_id}")
            return jsonify({
                'message': 'Universe not found',
                'error': f'No universe found with ID {universe_id}'
            }), 404
            
        # Check permissions - only universe owner can repair
        user_id = get_jwt_identity()
        if universe.user_id != user_id:
            current_app.logger.warning(f"Access denied: User {user_id} attempting to repair universe {universe_id} owned by {universe.user_id}")
            return jsonify({
                'message': 'Access denied',
                'error': 'Only the universe owner can perform repairs'
            }), 403
        
        # Perform the repair
        current_app.logger.info(f"Starting repair process for universe {universe_id}")
        result = Universe.repair_universe(universe_id)
        
        if result['success']:
            current_app.logger.info(f"Successfully repaired universe {universe_id}")
            return jsonify({
                'message': 'Universe repaired successfully',
                'details': result['message']
            }), 200
        else:
            current_app.logger.error(f"Error repairing universe {universe_id}: {result['message']}")
            return jsonify({
                'message': 'Error repairing universe',
                'error': result['message']
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Unexpected error repairing universe {universe_id}: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'message': 'Error repairing universe',
            'error': str(e)
        }), 500 