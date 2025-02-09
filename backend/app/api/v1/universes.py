from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.core.universe import Universe
from app.models.core.user import User
from app.services.export import ExportService
from app.core.errors import ValidationError, NotFoundError, AuthorizationError
from app.db.session import get_db
from app.websocket.handler import manager
import json
import logging

universes_bp = Blueprint('universes', __name__)

@universes_bp.route('/', methods=['GET'])
@jwt_required()
def get_universes():
    """Get all universes accessible to the user."""
    current_user_id = get_jwt_identity()
    with get_db() as db:
        universes = db.query(Universe).filter_by(user_id=current_user_id).all()
        return jsonify([universe.to_dict() for universe in universes])

@universes_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_universe(id):
    """Get a specific universe."""
    with get_db() as db:
        universe = Universe.get_by_id(db, id)
        if not universe:
            raise NotFoundError('Universe not found')
        return jsonify(universe.to_dict())

@universes_bp.route('/', methods=['POST'])
@jwt_required()
def create_universe():
    """Create a new universe."""
    data = request.get_json()
    logging.info(f"Received data for universe creation: {data}")
    current_user_id = get_jwt_identity()

    # Validate required fields
    if not all(k in data for k in ('name', 'description')):
        raise ValidationError('Missing required fields')

    with get_db() as db:
        universe = Universe(
            name=data['name'],
            description=data['description'],
            user_id=current_user_id
        )
        universe.save(db)
        return jsonify(universe.to_dict()), 201

@universes_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_universe(id):
    """Update a universe."""
    with get_db() as db:
        universe = Universe.get_by_id(db, id)
        if not universe:
            raise NotFoundError('Universe not found')

        data = request.get_json()
        # Update fields
        for key, value in data.items():
            if hasattr(universe, key):
                setattr(universe, key, value)

        universe.save(db)
        return jsonify(universe.to_dict())

@universes_bp.route('/<int:universe_id>', methods=['DELETE'])
@jwt_required()
def delete_universe(universe_id):
    """Delete a universe."""
    current_user_id = get_jwt_identity()
    with get_db() as db:
        universe = Universe.get_by_id(db, universe_id)
        if not universe or universe.user_id != current_user_id:
            raise AuthorizationError('Unauthorized')

        universe.delete()

        # Notify connected clients
        manager.broadcast_to_universe(str(universe_id), 'universe_deleted', {'universe_id': universe_id})

        return '', 204

@universes_bp.route('/<int:universe_id>/physics', methods=['PUT'])
@jwt_required()
def update_physics(universe_id):
    """Update physics parameters."""
    current_user_id = get_jwt_identity()
    with get_db() as db:
        universe = Universe.get_by_id(db, universe_id)
        if not universe or universe.user_id != current_user_id:
            raise AuthorizationError('Unauthorized')

        data = request.get_json()
        universe.update_physics(data)

        # Calculate and return new harmony
        harmony = universe.calculate_harmony(data)

        # Broadcast updates
        manager.broadcast_to_universe(str(universe_id), 'physics_changed', {
            'universe_id': universe_id,
            'parameters': data
        })
        manager.broadcast_to_universe(str(universe_id), 'harmony_changed', {
            'universe_id': universe_id,
            'harmony': harmony
        })

        return jsonify({
            'physics': data,
            'harmony': harmony
        }), 200

@universes_bp.route('/<int:universe_id>/story', methods=['POST'])
@jwt_required()
def add_story_point(universe_id):
    """Add a story point."""
    current_user_id = get_jwt_identity()
    with get_db() as db:
        universe = Universe.get_by_id(db, universe_id)
        if not universe or universe.user_id != current_user_id:
            raise AuthorizationError('Unauthorized')

        data = request.get_json()
        universe.update_story(data)

        # Broadcast update
        manager.broadcast_to_universe(str(universe_id), 'story_changed', {
            'universe_id': universe_id,
            'story_point': data
        })

        return jsonify(universe.to_dict())

@universes_bp.route('/<int:universe_id>/export', methods=['GET'])
@jwt_required()
def export_universe(universe_id):
    """Export universe data."""
    current_user_id = get_jwt_identity()
    with get_db() as db:
        universe = Universe.get_by_id(db, universe_id)
        if not universe or (universe.user_id != current_user_id and not universe.is_public):
            raise AuthorizationError('Unauthorized')

        format = request.args.get('format', 'json')

        if format == 'json':
            data = ExportService.export_to_json(universe)
            return jsonify(data), 200
        elif format == 'audio':
            try:
                filepath = ExportService.export_to_audio(universe)
                return send_file(
                    filepath,
                    mimetype='audio/wav',
                    as_attachment=True,
                    download_name=f'universe_{universe_id}_harmony.wav'
                )
            except Exception as e:
                return jsonify({'error': str(e)}), 500
            finally:
                ExportService.cleanup_export_file(filepath)
        else:
            return jsonify({'error': 'Unsupported export format'}), 400
