from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from ..extensions import db
from ..models import Universe, Favorite, User
from ..extensions import limiter
from ..utils.auth import check_universe_access

favorite_bp = Blueprint('favorites', __name__)

@favorite_bp.route('/universes/<int:universe_id>/favorite', methods=['POST'])
@jwt_required()
@limiter.limit("50 per hour")
def add_favorite(universe_id):
    """Add a universe to user's favorites"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        existing_favorite = Favorite.query.filter_by(
            user_id=current_user_id,
            universe_id=universe_id
        ).first()

        if existing_favorite:
            return jsonify({'error': 'Universe already in favorites'}), 409

        new_favorite = Favorite(
            user_id=current_user_id,
            universe_id=universe_id
        )

        db.session.add(new_favorite)
        db.session.commit()

        return jsonify({'message': 'Universe added to favorites'}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@favorite_bp.route('/universes/<int:universe_id>/favorite', methods=['DELETE'])
@jwt_required()
@limiter.limit("50 per hour")
def remove_favorite(universe_id):
    """Remove a universe from user's favorites"""
    try:
        current_user_id = get_jwt_identity()
        favorite = Favorite.query.filter_by(
            user_id=current_user_id,
            universe_id=universe_id
        ).first()

        if not favorite:
            return jsonify({'error': 'Universe not in favorites'}), 404

        db.session.delete(favorite)
        db.session.commit()

        return jsonify({'message': 'Universe removed from favorites'}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@favorite_bp.route('/favorites', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_favorites():
    """Get user's favorite universes"""
    try:
        current_user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        favorites = user.favorite_universes\
            .order_by(Universe.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'favorites': [universe.to_dict() for universe in favorites.items],
            'total': favorites.total,
            'pages': favorites.pages,
            'current_page': favorites.page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
