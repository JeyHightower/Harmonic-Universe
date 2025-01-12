# app/routes/universe_routes.py
from flask import Blueprint, jsonify, request, g
from app.routes.utils import login_required
from app.models import Universe
from app import db

universe_bp = Blueprint('universe', __name__)

@universe_bp.route('/', methods=['GET'])
@login_required
def get_universes():
    try:
        universes = Universe.query.filter_by(creator_id=g.current_user.id).all()
        result = [{
            'id': u.id,
            'name': u.name,
            'description': u.description,
            'gravity_constant': u.gravity_constant,
            'environment_harmony': u.environment_harmony
        } for u in universes]
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@universe_bp.route('/', methods=['POST'])
@login_required
def create_universe():
    if not request.headers.get('X-CSRF-Token'):
        return jsonify({'error': 'CSRF token missing'}), 400

    data = request.get_json()
    required_fields = ['name', 'description', 'gravity_constant', 'environment_harmony']

    # Validate required fields
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        new_universe = Universe(
            name=data['name'],
            description=data['description'],
            gravity_constant=data['gravity_constant'],
            environment_harmony=data['environment_harmony'],
            creator_id=g.current_user.id  # Add the creator_id from the logged-in user
        )
        db.session.add(new_universe)
        db.session.commit()
        return jsonify({
            'message': 'Universe created successfully!',
            'universe': {
                'id': new_universe.id,
                'name': new_universe.name,
                'description': new_universe.description,
                'gravity_constant': new_universe.gravity_constant,
                'environment_harmony': new_universe.environment_harmony
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@universe_bp.route('/<int:id>', methods=['PUT'])
@login_required
def update_universe(id):
    if not request.headers.get('X-CSRF-Token'):
        return jsonify({'error': 'CSRF token missing'}), 400

    try:
        universe = Universe.query.get_or_404(id)

        # Check if the user owns this universe
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized to modify this universe'}), 403

        data = request.get_json()

        # Update fields if they exist in the request
        if 'name' in data:
            universe.name = data['name']
        if 'description' in data:
            universe.description = data['description']
        if 'gravity_constant' in data:
            universe.gravity_constant = data['gravity_constant']
        if 'environment_harmony' in data:
            universe.environment_harmony = data['environment_harmony']

        db.session.commit()
        return jsonify({
            'message': 'Universe updated!',
            'universe': {
                'id': universe.id,
                'name': universe.name,
                'description': universe.description,
                'gravity_constant': universe.gravity_constant,
                'environment_harmony': universe.environment_harmony
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@universe_bp.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_universe(id):
    if not request.headers.get('X-CSRF-Token'):
        return jsonify({'error': 'CSRF token missing'}), 400

    try:
        universe = Universe.query.get_or_404(id)

        # Check if the user owns this universe
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized to delete this universe'}), 403

        db.session.delete(universe)
        db.session.commit()
        return jsonify({'message': 'Universe deleted successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@universe_bp.route('/<int:id>', methods=['GET'])
@login_required
def get_universe(id):
    try:
        universe = Universe.query.get_or_404(id)

        # Check if the user has access to this universe
        if universe.creator_id != g.current_user.id:
            return jsonify({'error': 'Unauthorized to view this universe'}), 403

        return jsonify({
            'id': universe.id,
            'name': universe.name,
            'description': universe.description,
            'gravity_constant': universe.gravity_constant,
            'environment_harmony': universe.environment_harmony
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400
