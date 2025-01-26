from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from app.models.universe import Universe
from app.schemas.universe import universe_schema, universes_schema

universe_routes = Blueprint('universe_routes', __name__)

@universe_routes.route('/api/universes', methods=['GET'])
@login_required
def get_universes():
    universes = Universe.query.filter_by(user_id=current_user.id).all()
    return jsonify(universes_schema.dump(universes))

@universe_routes.route('/api/universes', methods=['POST'])
@login_required
def create_universe():
    data = request.get_json()
    universe = Universe(
        name=data['name'],
        description=data.get('description', ''),
        user_id=current_user.id,
        parameters={
            'physics': {
                'gravity': 9.81,
                'friction': 0.5,
                'elasticity': 0.7,
                'airResistance': 0.1,
                'enableCollisions': True,
                'particleMass': 1.0,
                'timeScale': 1.0
            },
            'music': {
                'tempo': 120,
                'key': 'C',
                'scale': 'major',
                'harmony': 0.5
            },
            'visual': {
                'colorScheme': 'rainbow',
                'particleSize': 5,
                'trailLength': 50,
                'brightness': 0.8,
                'contrast': 1.0,
                'blurAmount': 0.2,
                'showGrid': True,
                'gridSize': 50,
                'showAxes': True,
                'backgroundColor': '#000000'
            }
        }
    )
    universe.save()
    return jsonify(universe_schema.dump(universe)), 201

@universe_routes.route('/api/universes/<int:id>', methods=['GET'])
@login_required
def get_universe(id):
    universe = Universe.query.get_or_404(id)
    if universe.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(universe_schema.dump(universe))

@universe_routes.route('/api/universes/<int:id>', methods=['PUT'])
@login_required
def update_universe(id):
    universe = Universe.query.get_or_404(id)
    if universe.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    universe.name = data.get('name', universe.name)
    universe.description = data.get('description', universe.description)
    universe.save()
    return jsonify(universe_schema.dump(universe))

@universe_routes.route('/api/universes/<int:id>/parameters/<string:type>', methods=['PUT'])
@login_required
def update_parameters(id, type):
    universe = Universe.query.get_or_404(id)
    if universe.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    if type not in ['physics', 'music', 'visual']:
        return jsonify({'error': 'Invalid parameter type'}), 400

    data = request.get_json()
    parameters = universe.parameters or {}
    parameters[type] = data
    universe.parameters = parameters
    universe.save()
    return jsonify(universe_schema.dump(universe))

@universe_routes.route('/api/universes/<int:id>', methods=['DELETE'])
@login_required
def delete_universe(id):
    universe = Universe.query.get_or_404(id)
    if universe.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    universe.delete()
    return '', 204

@universe_routes.route('/api/universes/<int:id>/export', methods=['GET'])
@login_required
def export_universe(id):
    universe = Universe.query.get_or_404(id)
    if universe.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    export_data = {
        'name': universe.name,
        'description': universe.description,
        'parameters': universe.parameters,
        'created_at': universe.created_at.isoformat(),
        'updated_at': universe.updated_at.isoformat()
    }
    return jsonify(export_data)
