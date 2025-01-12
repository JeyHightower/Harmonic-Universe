from flask import Blueprint, jsonify, request, g
from app.routes.utils import login_required
from app.models import MusicParameter, Universe
from app import db

music_bp = Blueprint('music', __name__)

@music_bp.route('/universes/<int:universe_id>/music', methods=['POST'])
@login_required
def add_music_parameter(universe_id):
    data = request.get_json()
    if not data or 'parameter_name' not in data or 'value' not in data or 'instrument' not in data:
        return jsonify({'error': 'Invalid Data'}), 400

    universe = Universe.query. get_or_404(universe_id)
    if universe.creator_id != g.current_user.id:
        return jsonify({ 'error': 'Unauthorized'}), 403

    new_parameter = MusicParameter(
        universe_id=universe_id,
        parameter_name=data['parameter_name'],
        value=data['value'],
        instrument=data['instrument']
    )
    db.session.add(new_parameter)
    db.session.commit()
    return jsonify({ 'message': 'Music parameter added Successfully'}), 201

@music_bp.route('/universes/<int:universe_id>/music', methods=['GET'])
@login_required
def get_music_parameters(universe_id):
    universe = Universe.query.get_or_404(universe_id)
    if universe.creator_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    parameters = MusicParameter.query.filter_by(universe_id=universe_id).all()
    result = [{'id': p.id, 'parameter_name': p.parameter_name, 'value': p.value, 'instrument': p.instrument} for p in parameters]
    return jsonify(result), 200

@music_bp.route('/universes/<int:universe_id>/music/<int:parameter_id>', methods=['PUT'])
@login_required
def update_music_parameter(universe_id, parameter_id):
    data = request.get_json()
    if not data or 'parameter_name' not in data or 'value' not in data or 'instrument' not in data:
        return jsonify({'error': 'Invalid Data'}), 400

    parameter = MusicParameter.query.get_or_404(parameter_id)
    if parameter.universe_id != universe_id:
        return jsonify({'error': 'Parameter not found in this Universe'}), 404

    universe = Universe.query.get_or_404(universe_id)
    if universe.creator_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    parameter.parameter_name = data['parameter_name']
    parameter.value = data['value']
    parameter.instrument = data['instrument']
    db.session.commit()
    return jsonify({'message': 'Music Parameter updated successfully'}), 200

@music_bp.route('/universes/<int:universe_id>/music/<int:parameter_id>', methods=['DELETE'])
@login_required
def delete_music_parameter(universe_id, parameter_id):
    parameter= MusicParameter.query.get_or_404(parameter_id)
    if parameter.universe_id != universe_id:
        return jsonify({'error': 'Parameter not found in this Universe'}), 404

    universe = Universe.query.get_or_404(universe_id)
    if universe.creator_id != g.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(parameter)
    db.session.commit()
    return jsonify({'message': "Music Parameter Successfully Deleted"}), 200
