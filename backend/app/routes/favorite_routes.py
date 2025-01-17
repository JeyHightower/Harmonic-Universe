from flask import Blueprint, jsonify, g
from app.models.favorite import Favorite
from app.models.universe import Universe
from app import db
from app.utils.token_manager import auto_token
from werkzeug.exceptions import NotFound, BadRequest
from sqlalchemy.exc import SQLAlchemyError

favorite_bp = Blueprint('favorite', __name__)

@favorite_bp.route('/universes/<int:universe_id>/favorite', methods=['POST'])
@auto_token
def add_favorite(universe_id):
    try:
        # Check if universe exists
        universe = Universe.query.get_or_404(universe_id)

        # Check if already favorited
        existing_favorite = Favorite.query.filter_by(
            user_id=g.current_user.id,
            universe_id=universe_id
        ).first()

        if existing_favorite:
            return jsonify({
                'error': 'Universe already favorited',
                'type': 'validation_error'
            }), 400

        # Create new favorite
        new_favorite = Favorite(
            user_id=g.current_user.id,
            universe_id=universe_id
        )

        db.session.add(new_favorite)
        db.session.commit()

        return jsonify({
            'message': 'Universe favorited successfully',
            'favorite': new_favorite.to_dict()
        }), 201

    except NotFound:
        return jsonify({
            'error': 'Universe not found',
            'type': 'not_found_error'
        }), 404
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'error': 'Database error',
            'type': 'server_error',
            'details': str(e)
        }), 500

@favorite_bp.route('/universes/<int:universe_id>/favorite', methods=['DELETE'])
@auto_token
def remove_favorite(universe_id):
    try:
        favorite = Favorite.query.filter_by(
            user_id=g.current_user.id,
            universe_id=universe_id
        ).first()

        if not favorite:
            return jsonify({
                'error': 'Universe not favorited',
                'type': 'not_found_error'
            }), 404

        db.session.delete(favorite)
        db.session.commit()

        return jsonify({
            'message': 'Favorite removed successfully'
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'error': 'Database error',
            'type': 'server_error',
            'details': str(e)
        }), 500

@favorite_bp.route('/favorites', methods=['GET'])
@auto_token
def get_favorites():
    try:
        favorites = Favorite.query.filter_by(user_id=g.current_user.id).all()
        return jsonify([favorite.to_dict() for favorite in favorites]), 200

    except SQLAlchemyError as e:
        return jsonify({
            'error': 'Database error',
            'type': 'server_error',
            'details': str(e)
        }), 500
