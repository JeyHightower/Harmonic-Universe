from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Favorite, Universe
from ..extensions import db, limiter

favorite_bp = Blueprint('favorite', __name__)

@favorite_bp.route('/universes/<int:universe_id>/favorite', methods=['POST'])
@jwt_required()
@limiter.limit("30 per hour")
def add_favorite(universe_id):
    """Add a universe to favorites."""
    try:
        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if not universe.is_public and universe.user_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        existing_favorite = Favorite.query.filter_by(
            universe_id=universe_id,
            user_id=current_user_id
        ).first()

        if existing_favorite:
            return jsonify({
                'status': 'error',
                'message': 'Universe already favorited'
            }), 409

        favorite = Favorite(
            universe_id=universe_id,
            user_id=current_user_id
        )
        db.session.add(favorite)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'data': {
                'favorite': favorite.to_dict()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@favorite_bp.route('/universes/<int:universe_id>/favorite', methods=['DELETE'])
@jwt_required()
@limiter.limit("10 per hour")
def remove_favorite(universe_id):
    """Remove a universe from favorites."""
    try:
        current_user_id = get_jwt_identity()
        favorite = Favorite.query.filter_by(
            universe_id=universe_id,
            user_id=current_user_id
        ).first_or_404()

        db.session.delete(favorite)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Universe removed from favorites'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@favorite_bp.route('/universes/favorites', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_favorites():
    """Get all favorite universes for the current user."""
    try:
        current_user_id = get_jwt_identity()
        favorites = Favorite.query.filter_by(user_id=current_user_id).all()

        return jsonify({
            'status': 'success',
            'data': {
                'favorites': [f.to_dict() for f in favorites]
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
