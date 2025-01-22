"""Integration tests for API routes."""
import pytest
import json
import websocket
import time
from datetime import datetime

def test_auth_routes(client, session):
    """Test authentication routes."""
    # Test signup
    signup_data = {
        "username": f"testuser_{int(time.time())}",
        "email": f"test_{int(time.time())}@test.com",
        "password": "testpass123"
    }
    response = client.post('/api/auth/register', json=signup_data)
    print(f"Response data: {response.data}")  # For debugging
    assert response.status_code == 201

    # Test login
    login_data = {
        "email": signup_data["email"],
        "password": signup_data["password"]
    }
    response = client.post('/api/auth/login', json=login_data)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'token' in data['data']

def test_protected_routes(client, auth_headers):
    """Test routes that require authentication."""
    # Test getting user profile
    print(f"Auth headers: {auth_headers}")
    response = client.get('/api/auth/me', headers=auth_headers)
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.get_data(as_text=True)}")
    assert response.status_code == 200

def test_universe_routes(client, auth_headers, session):
    """Test universe routes."""
    # Create universe
    universe_data = {
        "name": f"Test Universe {int(time.time())}",
        "description": "Test description",
        "physics_params": {
            "gravity": 9.81,
            "friction": 0.5
        },
        "audio_params": {
            "tempo": 120,
            "key": "C"
        }
    }
    response = client.post('/api/universes', json=universe_data, headers=auth_headers)
    assert response.status_code == 201
    data = json.loads(response.data)
    universe_id = data['data']['id']

    # Get universe
    response = client.get(f'/api/universes/{universe_id}', headers=auth_headers)
    assert response.status_code == 200

@pytest.fixture
def universe_id(client, auth_headers, session):
    """Create a test universe and return its ID."""
    universe_data = {
        "name": f"Test Universe {int(time.time())}",
        "description": "Test description",
        "physics_params": {
            "gravity": 9.81,
            "friction": 0.5
        },
        "audio_params": {
            "tempo": 120,
            "key": "C"
        }
    }
    response = client.post('/api/universes', json=universe_data, headers=auth_headers)
    assert response.status_code == 201
    data = json.loads(response.data)
    return data['data']['id']

def test_physics_routes(client, auth_headers, universe_id):
    """Test physics routes."""
    # Update physics parameters
    physics_data = {
        "gravity": 10.0,
        "friction": 0.3
    }
    response = client.put(
        f'/api/physics/{universe_id}/parameters',
        json=physics_data,
        headers=auth_headers
    )
    assert response.status_code == 200

def test_music_routes(client, auth_headers, universe_id):
    """Test music routes."""
    # Update music parameters
    music_data = {
        "tempo": 130,
        "key": "Am",
        "scale": "minor"
    }
    response = client.put(
        f'/api/audio/{universe_id}/parameters',
        json=music_data,
        headers=auth_headers
    )
    assert response.status_code == 200

@pytest.mark.skip(reason="WebSocket server not running in test environment")
def test_websocket():
    """Test WebSocket connection."""
    ws = websocket.WebSocket()
    try:
        ws.connect("ws://localhost:5002")
        print("WebSocket connection successful")

        # Join a room
        join_message = {
            "type": "join_room",
            "room_id": "test_room"
        }
        ws.send(json.dumps(join_message))
        result = ws.recv()
        print(f"Join room response: {result}")

        # Send a test message
        test_message = {
            "type": "test_message",
            "content": "Hello, WebSocket!"
        }
        ws.send(json.dumps(test_message))
        result = ws.recv()
        print(f"Test message response: {result}")

    except Exception as e:
        print(f"WebSocket test failed: {e}")
        raise
    finally:
        ws.close()
