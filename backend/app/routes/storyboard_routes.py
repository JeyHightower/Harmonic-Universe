from flask import Blueprint, jsonify, request, g
from app.models.storyboard import Storyboard
from app.models.universe import Universe
from app import db
from app.utils.token_manager import auto_token

storyboard_bp = Blueprint('storyboard', __name__)

@storyboard_bp.route('/', methods=['POST'])
@auto_token
def add_storyboard(universe_id):
    data = request.get_json()
    if not data or 'plot_point' not in data or 'description' not in data or 'harmony_tie' not in data:
        return jsonify({'error': 'Invalid Data'}), 400

    try:
        universe = Universe.query.get_or_404(universe_id)
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        new_storyboard = Storyboard(
            universe_id=universe_id,
            plot_point=data['plot_point'],
            description=data['description'],
            harmony_tie=data['harmony_tie']
        )
        db.session.add(new_storyboard)
        db.session.commit()

        return jsonify({
            'message': 'Storyboard added successfully',
            'storyboard': {
                'id': new_storyboard.id,
                'plot_point': new_storyboard.plot_point,
                'description': new_storyboard.description,
                'harmony_tie': new_storyboard.harmony_tie
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@storyboard_bp.route('/', methods=['GET'])
@auto_token
def get_storyboards(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        storyboards = Storyboard.query.filter_by(universe_id=universe_id).all()
        result = [{
            'id': s.id,
            'plot_point': s.plot_point,
            'description': s.description,
            'harmony_tie': s.harmony_tie
        } for s in storyboards]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@storyboard_bp.route('/<int:storyboard_id>', methods=['PUT'])
@auto_token
def update_storyboard(universe_id, storyboard_id):
    data = request.get_json()
    if not data or 'plot_point' not in data or 'description' not in data or 'harmony_tie' not in data:
        return jsonify({'error': 'Invalid Data'}), 400

    try:
        storyboard = Storyboard.query.get_or_404(storyboard_id)
        if storyboard.universe_id != universe_id:
            return jsonify({'error': 'Storyboard not found in this Universe'}), 404

        universe = Universe.query.get_or_404(universe_id)
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        storyboard.plot_point = data['plot_point']
        storyboard.description = data['description']
        storyboard.harmony_tie = data['harmony_tie']
        db.session.commit()

        return jsonify({
            'message': 'Storyboard updated successfully',
            'storyboard': {
                'id': storyboard.id,
                'plot_point': storyboard.plot_point,
                'description': storyboard.description,
                'harmony_tie': storyboard.harmony_tie
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@storyboard_bp.route('/<int:storyboard_id>', methods=['DELETE'])
@auto_token
def delete_storyboard(universe_id, storyboard_id):
    try:
        storyboard = Storyboard.query.get_or_404(storyboard_id)
        if storyboard.universe_id != universe_id:
            return jsonify({'error': 'Storyboard not found in this Universe'}), 404

        universe = Universe.query.get_or_404(universe_id)
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        db.session.delete(storyboard)
        db.session.commit()
        return jsonify({'message': 'Storyboard deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
