from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Comment, Universe
from ..extensions import db, limiter

comment_bp = Blueprint('comment', __name__)

@comment_bp.route('/api/universes/<int:universe_id>/comments', methods=['GET'])
@jwt_required()
def get_comments(universe_id):
    """Get all comments for a universe."""
    universe = Universe.query.get_or_404(universe_id)
    comments = Comment.get_universe_comments(universe_id)
    return jsonify([comment.to_dict() for comment in comments])

@comment_bp.route('/api/universes/<int:universe_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(universe_id):
    """Add a new comment to a universe."""
    universe = Universe.query.get_or_404(universe_id)
    data = request.get_json()

    if not data or 'content' not in data:
        return jsonify({"error": "Content is required"}), 400

    current_user_id = get_jwt_identity()
    parent_id = data.get('parent_id')

    comment = Comment(
        universe_id=universe_id,
        user_id=current_user_id,
        content=data['content'],
        parent_id=parent_id
    )

    db.session.add(comment)
    db.session.commit()

    return jsonify(comment.to_dict()), 201

@comment_bp.route('/api/universes/<int:universe_id>/comments/<int:comment_id>', methods=['PUT'])
@jwt_required()
def update_comment(universe_id, comment_id):
    """Update a comment."""
    comment = Comment.query.get_or_404(comment_id)
    current_user_id = get_jwt_identity()

    if comment.user_id != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({"error": "Content is required"}), 400

    comment.content = data['content']
    comment.is_edited = True
    db.session.commit()

    return jsonify(comment.to_dict())

@comment_bp.route('/api/universes/<int:universe_id>/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(universe_id, comment_id):
    """Delete a comment."""
    comment = Comment.query.get_or_404(comment_id)
    current_user_id = get_jwt_identity()

    if comment.user_id != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(comment)
    db.session.commit()

    return '', 204

@comment_bp.route('/api/users/me/comments', methods=['GET'])
@jwt_required()
def get_user_comments():
    """Get all comments by the current user."""
    current_user_id = get_jwt_identity()
    comments = Comment.get_user_comments(current_user_id)
    return jsonify([comment.to_dict() for comment in comments])
