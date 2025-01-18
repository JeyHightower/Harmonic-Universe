from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from ..extensions import db
from ..models import Universe, StoryboardPoint
from ..extensions import limiter
from ..utils.auth import check_universe_access

storyboard_bp = Blueprint('storyboard', __name__)

@storyboard_bp.route('/universes/<int:universe_id>/storyboard', methods=['POST'])
@jwt_required()
@limiter.limit("50 per hour")
def create_storyboard_point(universe_id):
    """Create a new storyboard point for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id, require_ownership=True):
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        if not data or not data.get('title') or not data.get('timestamp'):
            return jsonify({'error': 'Title and timestamp are required'}), 400

        new_point = StoryboardPoint(
            universe_id=universe_id,
            title=data['title'],
            description=data.get('description', ''),
            timestamp=data['timestamp'],
            harmony_value=data.get('harmony_value', 0.5),
            transition_duration=data.get('transition_duration', 1.0),
            # Physics state
            gravity=data.get('gravity'),
            friction=data.get('friction'),
            elasticity=data.get('elasticity'),
            air_resistance=data.get('air_resistance'),
            density=data.get('density'),
            # Audio state
            waveform=data.get('waveform'),
            attack=data.get('attack'),
            decay=data.get('decay'),
            sustain=data.get('sustain'),
            release=data.get('release'),
            lfo_rate=data.get('lfo_rate'),
            lfo_depth=data.get('lfo_depth')
        )

        db.session.add(new_point)
        db.session.commit()

        return jsonify(new_point.to_dict()), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@storyboard_bp.route('/universes/<int:universe_id>/storyboard', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_storyboard_points(universe_id):
    """Get all storyboard points for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        points = StoryboardPoint.query.filter_by(universe_id=universe_id)\
            .order_by(StoryboardPoint.timestamp)\
            .all()

        return jsonify([point.to_dict() for point in points]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@storyboard_bp.route('/storyboard/<int:point_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("50 per hour")
def update_storyboard_point(point_id):
    """Update a storyboard point"""
    try:
        current_user_id = get_jwt_identity()
        point = StoryboardPoint.query.get(point_id)

        if not point:
            return jsonify({'error': 'Storyboard point not found'}), 404

        universe = Universe.query.get(point.universe_id)
        if not check_universe_access(universe, current_user_id, require_ownership=True):
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        # Update basic info
        if 'title' in data:
            point.title = data['title']
        if 'description' in data:
            point.description = data['description']
        if 'timestamp' in data:
            point.timestamp = data['timestamp']
        if 'harmony_value' in data:
            point.harmony_value = data['harmony_value']
        if 'transition_duration' in data:
            point.transition_duration = data['transition_duration']

        # Update physics state
        if 'gravity' in data:
            point.gravity = data['gravity']
        if 'friction' in data:
            point.friction = data['friction']
        if 'elasticity' in data:
            point.elasticity = data['elasticity']
        if 'air_resistance' in data:
            point.air_resistance = data['air_resistance']
        if 'density' in data:
            point.density = data['density']

        # Update audio state
        if 'waveform' in data:
            point.waveform = data['waveform']
        if 'attack' in data:
            point.attack = data['attack']
        if 'decay' in data:
            point.decay = data['decay']
        if 'sustain' in data:
            point.sustain = data['sustain']
        if 'release' in data:
            point.release = data['release']
        if 'lfo_rate' in data:
            point.lfo_rate = data['lfo_rate']
        if 'lfo_depth' in data:
            point.lfo_depth = data['lfo_depth']

        db.session.commit()
        return jsonify(point.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@storyboard_bp.route('/storyboard/<int:point_id>', methods=['DELETE'])
@jwt_required()
@limiter.limit("20 per hour")
def delete_storyboard_point(point_id):
    """Delete a storyboard point"""
    try:
        current_user_id = get_jwt_identity()
        point = StoryboardPoint.query.get(point_id)

        if not point:
            return jsonify({'error': 'Storyboard point not found'}), 404

        universe = Universe.query.get(point.universe_id)
        if not check_universe_access(universe, current_user_id, require_ownership=True):
            return jsonify({'error': 'Unauthorized'}), 403

        db.session.delete(point)
        db.session.commit()

        return jsonify({'message': 'Storyboard point deleted successfully'}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500
