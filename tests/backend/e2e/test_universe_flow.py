import pytest
import json
import time
from flask_socketio import SocketIOTestClient
from app.models.user import User
from app.models.universe import Universe
from app import create_app, socketio, db

@pytest.fixture
def auth_headers(app, test_user):
    """Get authentication headers"""
    from flask_jwt_extended import create_access_token
    access_token = create_access_token(identity=test_user.id)
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture
def socket_client(app, test_user):
    """Create a WebSocket test client"""
    from flask_jwt_extended import create_access_token
    access_token = create_access_token(identity=test_user.id)

    client = SocketIOTestClient(
        app,
        socketio,
        query_string=f"token={access_token}"
    )
    return client

def test_complete_universe_flow(client, socket_client, auth_headers):
    """Test complete flow of universe creation and interaction"""

    # 1. Create a new universe
    create_data = {
        "name": "E2E Test Universe",
        "description": "Testing complete flow",
        "max_participants": 10,
        "is_public": True,
        "parameters": {
            "physics": {
                "gravity": 9.81,
                "friction": 0.5
            },
            "music": {
                "tempo": 120,
                "key": "C",
                "scale": "major"
            }
        }
    }

    response = client.post(
        "/api/universes",
        data=json.dumps(create_data),
        content_type="application/json",
        headers=auth_headers
    )

    assert response.status_code == 201
    universe_data = json.loads(response.data)
    universe_id = universe_data["id"]

    # 2. Connect to universe via WebSocket
    socket_client.emit('join', {'universe_id': universe_id}, namespace='/test')
    time.sleep(0.1)  # Wait for response
    received = socket_client.get_received(namespace='/test')
    assert len(received) > 0

    # 3. Update universe parameters
    update_data = {
        'universe_id': universe_id,
        'parameters': {
            'physics': {
                'gravity': 7.0
            }
        }
    }
    socket_client.emit('parameter_update', update_data, namespace='/test')
    time.sleep(0.1)
    received = socket_client.get_received(namespace='/test')
    assert len(received) > 0

    # 4. Start simulation
    socket_client.emit('start_simulation', {'universe_id': universe_id}, namespace='/test')
    time.sleep(0.1)
    received = socket_client.get_received(namespace='/test')
    assert len(received) > 0

    # 5. Stop simulation
    socket_client.emit('stop_simulation', {'universe_id': universe_id}, namespace='/test')
    time.sleep(0.1)
    received = socket_client.get_received(namespace='/test')
    assert len(received) > 0

    # 6. Leave universe
    socket_client.emit('leave', {'universe_id': universe_id}, namespace='/test')
    time.sleep(0.1)
    received = socket_client.get_received(namespace='/test')
    assert len(received) > 0

    # 7. Delete universe
    response = client.delete(f"/api/universes/{universe_id}", headers=auth_headers)
    assert response.status_code == 204

    # 8. Verify universe is deleted
    response = client.get(f"/api/universes/{universe_id}", headers=auth_headers)
    assert response.status_code == 404

def test_collaborative_universe_flow(client, socket_client, auth_headers, test_user):
    """Test collaborative features of universe interaction"""

    # 1. Create a universe
    create_data = {
        "name": "Collaborative Universe",
        "description": "Testing collaboration",
        "is_public": True
    }

    response = client.post(
        "/api/universes",
        data=json.dumps(create_data),
        content_type="application/json",
        headers=auth_headers
    )

    assert response.status_code == 201
    universe_data = json.loads(response.data)
    universe_id = universe_data["id"]

    # 2. Create another user
    other_user = User(username="collaborator", email="collab@example.com")
    other_user.set_password("password123")
    db.session.add(other_user)
    db.session.commit()

    # 3. Get auth token for other user
    from flask_jwt_extended import create_access_token
    other_token = create_access_token(identity=other_user.id)
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # 4. Create socket client for other user
    other_socket = SocketIOTestClient(
        client.application,
        socketio,
        namespace='/test',
        query_string=f"token={other_token}"
    )

    # 5. Both users join universe
    socket_client.emit('join', {'universe_id': universe_id}, namespace='/test')
    other_socket.emit('join', {'universe_id': universe_id}, namespace='/test')
    time.sleep(0.1)

    # Clear initial messages
    socket_client.get_received(namespace='/test')
    other_socket.get_received(namespace='/test')

    # 6. First user updates parameters
    update_data = {
        'universe_id': universe_id,
        'parameters': {
            'physics': {
                'gravity': 7.0
            }
        }
    }
    socket_client.emit('parameter_update', update_data, namespace='/test')
    time.sleep(0.1)

    # Both clients should receive the update
    received1 = socket_client.get_received(namespace='/test')
    received2 = other_socket.get_received(namespace='/test')
    assert len(received1) > 0 and len(received2) > 0

    # 8. Both users leave
    socket_client.emit('leave', {'universe_id': universe_id}, namespace='/test')
    other_socket.emit('leave', {'universe_id': universe_id}, namespace='/test')

    # 9. Cleanup
    response = client.delete(f"/api/universes/{universe_id}", headers=auth_headers)
    assert response.status_code == 204
