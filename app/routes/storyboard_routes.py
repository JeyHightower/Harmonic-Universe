from flask import Blueprint, jsonify, request, g
from app.routes.utils import login_required
from app.models import db, Storyboard, Universe

storyboard_bp = Blueprint('storyboard', __name__)

@storyboard_bp.route('/universes/<int:universe_id>/storyboards', methods=['POST'])
@login_required
def add_storyboard(universe_id):
    data = request.get_json()
    if not data or 'plot_point' not in data or 'description' not in data:
        return jsonify({'error': 'Invalid Data'}), 400

    universe = Universe.query.get_or_404(universe_id)
    if universe.creator_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    new_storyboard = Storyboard(
        universe_id=universe_id,
        plot_point=data['plot_point'],
        description=data['description'],
        harmony_tie=data.get('harmony_tie')
    )
    db.session.add(new_storyboard)
    db.session.commit()
    return jsonify({'message': 'Storyboard added Successfully'}), 201

@storyboard_bp.route('/universes/<int:universe_id>/storyboards', methods=['GET'])
@login_required
def get_storyboards(universe_id):
    universe = Universe.query.get_or_404(universe_id)
    if universe.creator_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    storyboards = Storyboard.query.filter_by(universe_id=universe_id).all()
    result = [{
        'id': s.id,
        'plot_point': s.plot_point,
        'description': s.description,
        'harmony_tie': s.harmony_tie,
        'created_at': s.created_at.isoformat()
    } for s in storyboards]
    return jsonify(result), 200

@storyboard_bp.route('/universes/<int:universe_id>/storyboards/<int:storyboard_id>', methods=['PUT'])
@login_required
def update_storyboard(universe_id, storyboard_id):
    data = request.get_json()
    if not data or 'plot_point' not in data or 'description' not in data:
        return jsonify({'error': 'Invalid Data'}), 400

    storyboard = Storyboard.query.get_or_404(storyboard_id)
    if storyboard.universe_id != universe_id:
        return jsonify({'error': 'Storyboard not found in this Universe'}), 404

    universe = Universe.query.get_or_404(universe_id)
    if universe.creator_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    storyboard.plot_point = data['plot_point']
    storyboard.description = data['description']
    storyboard.harmony_tie = data.get('harmony_tie', storyboard.harmony_tie)
    db.session.commit()
    return jsonify({'message': 'Storyboard updated successfully'}), 200

@storyboard_bp.route('/universes/<int:universe_id>/storyboards/<int:storyboard_id>', methods=['DELETE'])
@login_required
def delete_storyboard(universe_id, storyboard_id):
    storyboard = Storyboard.query.get_or_404(storyboard_id)
    if storyboard.universe_id != universe_id:
        return jsonify({'error': 'Storyboard not found in this Universe'}), 404

    universe = Universe.query.get_or_404(universe_id)
    if universe.creator_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(storyboard)
    db.session.commit()
    return jsonify({'message': 'Storyboard deleted successfully'}), 200
