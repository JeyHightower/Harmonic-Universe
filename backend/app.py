from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Mock database for testing
users_db = {
    "test@example.com": {
        "password": "password123",
        "id": 1,
        "name": "Test User"
    }
}

universes_db = {}
notifications_db = {}
preferences_db = {}

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users_db.get(email)
    if user and user['password'] == password:
        return jsonify({
            "token": "mock_token",
            "user": {
                "id": user['id'],
                "email": email,
                "name": user['name']
            }
        })
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/preferences', methods=['GET', 'PUT'])
def handle_preferences():
    # For testing, we'll use a fixed user ID
    user_id = 1

    if request.method == 'GET':
        # Return default preferences if none exist
        return jsonify(preferences_db.get(user_id, {
            "theme": "light",
            "emailNotifications": True,
            "pushNotifications": True,
            "highContrast": False,
            "fontSize": 16,
            "dashboardLayout": "grid",
            "language": "en",
            "timezone": "UTC"
        }))

    data = request.get_json()
    preferences_db[user_id] = data
    return jsonify(data)

@app.route('/api/universes', methods=['GET', 'POST'])
def handle_universes():
    if request.method == 'GET':
        return jsonify(list(universes_db.values()))

    data = request.get_json()
    universe_id = len(universes_db) + 1
    new_universe = {
        "id": universe_id,
        "name": data['name'],
        "description": data['description'],
        "isPublic": data.get('isPublic', False),
        "allowGuests": data.get('allowGuests', False),
        "createdAt": datetime.now().isoformat()
    }
    universes_db[universe_id] = new_universe
    return jsonify(new_universe), 201

@app.route('/api/universes/<int:universe_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_universe(universe_id):
    universe = universes_db.get(universe_id)
    if not universe:
        return jsonify({"error": "Universe not found"}), 404

    if request.method == 'GET':
        return jsonify(universe)

    elif request.method == 'PUT':
        data = request.get_json()
        universe.update(data)
        return jsonify(universe)

    elif request.method == 'DELETE':
        del universes_db[universe_id]
        return '', 204

@app.route('/api/notifications', methods=['GET', 'POST'])
def handle_notifications():
    if request.method == 'GET':
        return jsonify(list(notifications_db.values()))

    data = request.get_json()
    notification_id = len(notifications_db) + 1
    new_notification = {
        "id": notification_id,
        "type": data['type'],
        "message": data['message'],
        "isRead": False,
        "createdAt": datetime.now().isoformat()
    }
    notifications_db[notification_id] = new_notification
    socketio.emit('notification', new_notification)
    return jsonify(new_notification), 201

@app.route('/api/notifications/<int:notification_id>', methods=['PATCH', 'DELETE'])
def handle_notification(notification_id):
    notification = notifications_db.get(notification_id)
    if not notification:
        return jsonify({"error": "Notification not found"}), 404

    if request.method == 'PATCH':
        data = request.get_json()
        notification.update(data)
        return jsonify(notification)

    elif request.method == 'DELETE':
        del notifications_db[notification_id]
        return '', 204

@app.route('/api/notifications/mark-all-read', methods=['POST'])
def mark_all_notifications_read():
    for notification in notifications_db.values():
        notification['isRead'] = True
    return jsonify(list(notifications_db.values()))

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
