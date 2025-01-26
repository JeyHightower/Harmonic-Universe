from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from app.models.universe import Universe
from app.models.activity import Activity
from app.sockets import socketio
from datetime import datetime

collaboration = Blueprint('collaboration', __name__)

@collaboration.route('/api/collaboration/presence/<int:universe_id>', methods=['POST'])
@login_required
def update_presence(universe_id):
    """Update user presence in a universe"""
    universe = Universe.query.get_or_404(universe_id)

    data = request.json
    current_view = data.get('currentView', 'unknown')

    # Emit presence update to all users in the universe
    socketio.emit('user_joined', {
        'userId': str(current_user.id),
        'presence': {
            'userId': str(current_user.id),
            'username': current_user.username,
            'avatar': current_user.avatar,
            'lastActive': datetime.utcnow().isoformat(),
            'currentView': current_view,
            'isTyping': False
        }
    }, room=f'universe_{universe_id}')

    return jsonify({'status': 'success'})

@collaboration.route('/api/collaboration/activity/<int:universe_id>', methods=['GET'])
@login_required
def get_activities(universe_id):
    """Get recent activities in a universe"""
    universe = Universe.query.get_or_404(universe_id)

    # Get last 50 activities
    activities = Activity.query.filter_by(universe_id=universe_id)\
        .order_by(Activity.timestamp.desc())\
        .limit(50)\
        .all()

    return jsonify([activity.to_dict() for activity in activities])

@collaboration.route('/api/collaboration/activity/<int:universe_id>', methods=['POST'])
@login_required
def create_activity(universe_id):
    """Create a new activity record"""
    universe = Universe.query.get_or_404(universe_id)

    data = request.json
    activity = Activity(
        universe_id=universe_id,
        user_id=current_user.id,
        action=data['action'],
        target=data['target'],
        details=data.get('details')
    )

    activity.save()

    # Emit activity to all users in the universe
    socketio.emit('activity_created', activity.to_dict(), room=f'universe_{universe_id}')

    return jsonify(activity.to_dict())

@collaboration.route('/api/collaboration/cursor/<int:universe_id>', methods=['POST'])
@login_required
def update_cursor(universe_id):
    """Update user cursor position"""
    universe = Universe.query.get_or_404(universe_id)

    data = request.json
    position = data.get('position', {})

    # Emit cursor position to all users in the universe except sender
    socketio.emit('cursor_moved', {
        'userId': str(current_user.id),
        'position': position
    }, room=f'universe_{universe_id}', include_self=False)

    return jsonify({'status': 'success'})

@collaboration.route('/api/collaboration/typing/<int:universe_id>', methods=['POST'])
@login_required
def update_typing_status(universe_id):
    """Update user typing status"""
    universe = Universe.query.get_or_404(universe_id)

    data = request.json
    is_typing = data.get('isTyping', False)

    # Emit typing status to all users in the universe except sender
    socketio.emit('user_typing', {
        'userId': str(current_user.id),
        'isTyping': is_typing
    }, room=f'universe_{universe_id}', include_self=False)

    return jsonify({'status': 'success'})
