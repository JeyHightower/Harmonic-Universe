from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from ..extensions import db
from ..models import Comment, Universe
from ..extensions import limiter
from ..utils.auth import check_universe_access

comment_bp = Blueprint('comment', __name__)

@comment_bp.route('/<int:universe_id>', methods=['POST'])
@jwt_required()
@limiter.limit("30 per hour")
def create_comment(universe_id):
    """Create a new comment for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        if not data or not data.get('content'):
            return jsonify({'error': 'Comment content is required'}), 400

        new_comment = Comment(
            user_id=current_user_id,
            universe_id=universe_id,
            content=data['content']
        )

        db.session.add(new_comment)
        db.session.commit()

        return jsonify(new_comment.to_dict()), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@comment_bp.route('/<int:universe_id>', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_comments(universe_id):
    """Get all comments for a universe"""
    try:
        current_user_id = get_jwt_identity()
        universe = Universe.query.get(universe_id)

        if not universe:
            return jsonify({'error': 'Universe not found'}), 404

        if not check_universe_access(universe, current_user_id):
            return jsonify({'error': 'Unauthorized'}), 403

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        comments = Comment.query.filter_by(universe_id=universe_id)\
            .order_by(Comment.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'comments': [comment.to_dict() for comment in comments.items],
            'total': comments.total,
            'pages': comments.pages,
            'current_page': comments.page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@comment_bp.route('/<int:comment_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("30 per hour")
def update_comment(comment_id):
    """Update a comment"""
    try:
        current_user_id = get_jwt_identity()
        comment = Comment.query.get(comment_id)

        if not comment:
            return jsonify({'error': 'Comment not found'}), 404

        if comment.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        if not data or not data.get('content'):
            return jsonify({'error': 'Comment content is required'}), 400

        comment.content = data['content']
        db.session.commit()

        return jsonify(comment.to_dict()), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@comment_bp.route('/<int:comment_id>', methods=['DELETE'])
@jwt_required()
@limiter.limit("20 per hour")
def delete_comment(comment_id):
    """Delete a comment"""
    try:
        current_user_id = get_jwt_identity()
        comment = Comment.query.get(comment_id)

        if not comment:
            return jsonify({'error': 'Comment not found'}), 404

        if comment.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        db.session.delete(comment)
        db.session.commit()

        return jsonify({'message': 'Comment deleted successfully'}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500
