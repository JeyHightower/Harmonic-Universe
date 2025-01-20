from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Storyboard, Universe, Version
from ..extensions import db, limiter

storyboard_bp = Blueprint('storyboard', __name__)

@storyboard_bp.route('/<int:universe_id>', methods=['POST'])
@jwt_required()
@limiter.limit("30 per hour")
def create_storyboard(universe_id):
    """Create a new storyboard."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if not universe.is_public and universe.user_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        storyboard = Storyboard(
            plot_point=data.get('plot_point'),
            description=data.get('description', ''),
            harmony_tie=data.get('harmony_tie', 0.5),
            universe_id=universe_id,
            user_id=current_user_id
        )
        db.session.add(storyboard)
        db.session.commit()

        # Create initial version
        Version.create_version(
            storyboard_id=storyboard.id,
            content=data.get('content', ''),
            description='Initial version',
            created_by=current_user_id
        )

        return jsonify({
            'status': 'success',
            'data': {
                'storyboard': storyboard.to_dict()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@storyboard_bp.route('/<int:universe_id>', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_storyboards(universe_id):
    """Get all storyboards for a universe."""
    try:
        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if not universe.is_public and universe.user_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        storyboards = Storyboard.query.filter_by(universe_id=universe_id).all()
        return jsonify({
            'status': 'success',
            'data': {
                'storyboards': [s.to_dict() for s in storyboards]
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@storyboard_bp.route('/<int:storyboard_id>/versions', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_storyboard_versions(storyboard_id):
    """Get all versions of a storyboard."""
    try:
        storyboard = Storyboard.query.get_or_404(storyboard_id)
        universe = Universe.query.get_or_404(storyboard.universe_id)
        current_user_id = get_jwt_identity()

        if not universe.is_public and universe.user_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        versions = Version.query.filter_by(storyboard_id=storyboard_id).order_by(Version.created_at.desc()).all()
        return jsonify({
            'status': 'success',
            'data': {
                'versions': [v.to_dict() for v in versions]
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@storyboard_bp.route('/<int:storyboard_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("30 per hour")
def update_storyboard(storyboard_id):
    """Update a storyboard."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        storyboard = Storyboard.query.get_or_404(storyboard_id)
        current_user_id = get_jwt_identity()

        if storyboard.user_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        if 'plot_point' in data:
            storyboard.plot_point = data['plot_point']
        if 'description' in data:
            storyboard.description = data['description']
        if 'harmony_tie' in data:
            storyboard.harmony_tie = data['harmony_tie']

        # Create new version if content is provided
        if 'content' in data:
            Version.create_version(
                storyboard_id=storyboard.id,
                content=data['content'],
                description=data.get('version_description', 'Update'),
                created_by=current_user_id
            )

        db.session.commit()
        return jsonify({
            'status': 'success',
            'data': {
                'storyboard': storyboard.to_dict()
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@storyboard_bp.route('/<int:storyboard_id>', methods=['DELETE'])
@jwt_required()
@limiter.limit("10 per hour")
def delete_storyboard(storyboard_id):
    """Delete a storyboard."""
    try:
        storyboard = Storyboard.query.get_or_404(storyboard_id)
        current_user_id = get_jwt_identity()

        if storyboard.user_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        db.session.delete(storyboard)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Storyboard deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
