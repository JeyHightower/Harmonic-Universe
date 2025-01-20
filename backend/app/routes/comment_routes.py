from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Comment, Universe
from ..extensions import db, limiter

comment_bp = Blueprint('comment', __name__)

@comment_bp.route('/<int:universe_id>', methods=['POST'])
@jwt_required()
@limiter.limit("30 per hour")
def create_comment(universe_id):
    """Create a new comment."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        content = data.get('content')
        if not content:
            return jsonify({
                'status': 'error',
                'message': 'Content is required'
            }), 400

        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if not universe.is_public and universe.user_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        comment = Comment(
            content=content,
            universe_id=universe_id,
            user_id=current_user_id,
            parent_id=data.get('parent_id')
        )
        db.session.add(comment)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'data': {
                'comment': comment.to_dict()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@comment_bp.route('/<int:universe_id>', methods=['GET'])
@jwt_required()
@limiter.limit("100 per hour")
def get_comments(universe_id):
    """Get all comments for a universe."""
    try:
        universe = Universe.query.get_or_404(universe_id)
        current_user_id = get_jwt_identity()

        if not universe.is_public and universe.user_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        # Get top-level comments (no parent_id)
        comments = Comment.query.filter_by(
            universe_id=universe_id,
            parent_id=None
        ).all()

        return jsonify({
            'status': 'success',
            'data': {
                'comments': [c.to_dict() for c in comments]
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@comment_bp.route('/<int:comment_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("30 per hour")
def update_comment(comment_id):
    """Update a comment."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        content = data.get('content')
        if not content:
            return jsonify({
                'status': 'error',
                'message': 'Content is required'
            }), 400

        comment = Comment.query.get_or_404(comment_id)
        current_user_id = get_jwt_identity()

        if comment.user_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        comment.content = content
        db.session.commit()

        return jsonify({
            'status': 'success',
            'data': {
                'comment': comment.to_dict()
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@comment_bp.route('/<int:comment_id>', methods=['DELETE'])
@jwt_required()
@limiter.limit("10 per hour")
def delete_comment(comment_id):
    """Delete a comment."""
    try:
        comment = Comment.query.get_or_404(comment_id)
        current_user_id = get_jwt_identity()

        if comment.user_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized access'
            }), 403

        db.session.delete(comment)
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Comment deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
