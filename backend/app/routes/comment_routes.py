from flask import Blueprint, jsonify, request, g
from app.models.comment import Comment
from app.models.universe import Universe
from app import db
from app.utils.token_manager import auto_token
from werkzeug.exceptions import NotFound, BadRequest, Forbidden
from sqlalchemy.exc import SQLAlchemyError

comment_bp = Blueprint('comment', __name__)

def validate_comment_data(data):
    """Validate comment data"""
    if not data or not isinstance(data, dict):
        raise BadRequest('Invalid comment data')

    if 'content' not in data or not data['content'].strip():
        raise BadRequest('Comment content is required')

    return {
        'content': data['content'].strip(),
        'parent_id': data.get('parent_id')
    }

@comment_bp.route('/universes/<int:universe_id>/comments', methods=['GET'])
@auto_token
def get_comments(universe_id):
    try:
        # Check if universe exists and is accessible
        universe = Universe.query.get_or_404(universe_id)
        if not universe.is_public and universe.creator_id != g.current_user.id:
            raise Forbidden('You do not have access to this universe')

        # Get top-level comments (no parent_id)
        comments = Comment.query.filter_by(
            universe_id=universe_id,
            parent_id=None
        ).order_by(Comment.created_at.desc()).all()

        return jsonify([comment.to_dict() for comment in comments]), 200

    except (NotFound, Forbidden) as e:
        return jsonify({'error': str(e), 'type': 'authorization_error'}), 403
    except Exception as e:
        return jsonify({
            'error': 'An unexpected error occurred',
            'type': 'server_error',
            'details': str(e)
        }), 500

@comment_bp.route('/universes/<int:universe_id>/comments', methods=['POST'])
@auto_token
def add_comment(universe_id):
    try:
        data = validate_comment_data(request.get_json())

        # Check if universe exists and is accessible
        universe = Universe.query.get_or_404(universe_id)
        if not universe.is_public and universe.creator_id != g.current_user.id:
            raise Forbidden('You do not have access to this universe')

        # If it's a reply, verify parent comment exists
        if data['parent_id']:
            parent_comment = Comment.query.get_or_404(data['parent_id'])
            if parent_comment.universe_id != universe_id:
                raise BadRequest('Parent comment does not belong to this universe')

        # Create new comment
        new_comment = Comment(
            content=data['content'],
            universe_id=universe_id,
            user_id=g.current_user.id,
            parent_id=data['parent_id']
        )

        db.session.add(new_comment)
        db.session.commit()

        return jsonify({
            'message': 'Comment added successfully',
            'comment': new_comment.to_dict()
        }), 201

    except (NotFound, BadRequest, Forbidden) as e:
        return jsonify({'error': str(e), 'type': 'validation_error'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'error': 'Database error',
            'type': 'server_error',
            'details': str(e)
        }), 500

@comment_bp.route('/universes/<int:universe_id>/comments/<int:comment_id>', methods=['PUT'])
@auto_token
def update_comment(universe_id, comment_id):
    try:
        data = validate_comment_data(request.get_json())

        # Check if comment exists and belongs to user
        comment = Comment.query.get_or_404(comment_id)
        if comment.user_id != g.current_user.id:
            raise Forbidden('You can only edit your own comments')
        if comment.universe_id != universe_id:
            raise NotFound('Comment not found in this universe')

        # Update comment
        comment.content = data['content']
        db.session.commit()

        return jsonify({
            'message': 'Comment updated successfully',
            'comment': comment.to_dict()
        }), 200

    except (NotFound, BadRequest, Forbidden) as e:
        return jsonify({'error': str(e), 'type': 'validation_error'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'error': 'Database error',
            'type': 'server_error',
            'details': str(e)
        }), 500

@comment_bp.route('/universes/<int:universe_id>/comments/<int:comment_id>', methods=['DELETE'])
@auto_token
def delete_comment(universe_id, comment_id):
    try:
        # Check if comment exists and belongs to user
        comment = Comment.query.get_or_404(comment_id)
        if comment.user_id != g.current_user.id:
            raise Forbidden('You can only delete your own comments')
        if comment.universe_id != universe_id:
            raise NotFound('Comment not found in this universe')

        db.session.delete(comment)
        db.session.commit()

        return jsonify({
            'message': 'Comment deleted successfully'
        }), 200

    except (NotFound, Forbidden) as e:
        return jsonify({'error': str(e), 'type': 'authorization_error'}), 403
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'error': 'Database error',
            'type': 'server_error',
            'details': str(e)
        }), 500
