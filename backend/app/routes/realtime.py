"""Realtime routes for managing real-time collaboration state."""
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.models import db, RealtimeState, Universe
from app.utils.auth import require_universe_access
from datetime import datetime, timezone, timedelta

bp = Blueprint('realtime', __name__)

@bp.route('/api/universes/<int:universe_id>/active-users', methods=['GET'])
@login_required
@require_universe_access()
def get_active_users(universe_id):
    """Get list of active users in a universe."""
    try:
        universe = Universe.query.get_or_404(universe_id)
        active_users = universe.get_active_users()
        return jsonify(active_users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/universes/<int:universe_id>/state', methods=['GET'])
@login_required
@require_universe_access()
def get_user_state(universe_id):
    """Get current user's state in a universe."""
    try:
        state = RealtimeState.query.filter_by(
            universe_id=universe_id,
            user_id=current_user.id
        ).first()

        if not state:
            return jsonify(None)

        return jsonify(state.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/universes/<int:universe_id>/state', methods=['PUT'])
@login_required
@require_universe_access()
def update_user_state(universe_id):
    """Update current user's state in a universe."""
    try:
        data = request.get_json()

        state = RealtimeState.query.filter_by(
            universe_id=universe_id,
            user_id=current_user.id
        ).first()

        if not state:
            state = RealtimeState(
                universe_id=universe_id,
                user_id=current_user.id
            )
            db.session.add(state)

        if 'cursor_position' in data:
            state.update_cursor(data['cursor_position'])

        if 'typing_status' in data:
            state.update_typing_status(data['typing_status'])

        db.session.commit()
        return jsonify(state.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/universes/<int:universe_id>/state', methods=['DELETE'])
@login_required
@require_universe_access()
def clear_user_state(universe_id):
    """Clear current user's state in a universe."""
    try:
        state = RealtimeState.query.filter_by(
            universe_id=universe_id,
            user_id=current_user.id
        ).first()

        if state:
            db.session.delete(state)
            db.session.commit()

        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
