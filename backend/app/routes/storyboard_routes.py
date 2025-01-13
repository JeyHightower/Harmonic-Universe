from flask import Blueprint, jsonify, request, g
from app.models.storyboard import Storyboard
from app.models.universe import Universe
from app import db
from app.utils.token_manager import auto_token

storyboard_bp = Blueprint('storyboard', __name__)

@storyboard_bp.route('/<int:universe_id>/storyboards', methods=['POST'])
@auto_token
def create_storyboard(universe_id):
    data = request.get_json()
    if not data or 'title' not in data or 'content' not in data:
        return jsonify({'error': 'Invalid Data'}), 400

    try:
        universe = Universe.query.get_or_404(universe_id)
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        new_storyboard = Storyboard(
            universe_id=universe_id,
            title=data['title'],
            content=data['content'],
            sequence_number=data.get('sequence_number', 1)
        )
        db.session.add(new_storyboard)
        db.session.commit()

        return jsonify({
            'message': 'Storyboard created successfully',
            'storyboard': {
                'id': new_storyboard.id,
                'title': new_storyboard.title,
                'content': new_storyboard.content,
                'sequence_number': new_storyboard.sequence_number
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@storyboard_bp.route('/<int:universe_id>/storyboards', methods=['GET'])
@auto_token
def get_storyboards(universe_id):
    try:
        universe = Universe.query.get_or_404(universe_id)
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        storyboards = Storyboard.query.filter_by(universe_id=universe_id).order_by(Storyboard.sequence_number).all()
        result = [{
            'id': s.id,
            'title': s.title,
            'content': s.content,
            'sequence_number': s.sequence_number
        } for s in storyboards]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@storyboard_bp.route('/<int:universe_id>/storyboards/<int:storyboard_id>', methods=['PUT'])
@auto_token
def update_storyboard(universe_id, storyboard_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid Data'}), 400

    try:
        storyboard = Storyboard.query.get_or_404(storyboard_id)
        if storyboard.universe_id != universe_id:
            return jsonify({'error': 'Storyboard not found in this Universe'}), 404

        universe = Universe.query.get_or_404(universe_id)
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        if 'title' in data:
            storyboard.title = data['title']
        if 'content' in data:
            storyboard.content = data['content']
        if 'sequence_number' in data:
            storyboard.sequence_number = data['sequence_number']

        db.session.commit()

        return jsonify({
            'message': 'Storyboard updated successfully',
            'storyboard': {
                'id': storyboard.id,
                'title': storyboard.title,
                'content': storyboard.content,
                'sequence_number': storyboard.sequence_number
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@storyboard_bp.route('/<int:universe_id>/storyboards/<int:storyboard_id>', methods=['DELETE'])
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
