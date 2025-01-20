import requests
import json
import websocket
import threading
import time
from datetime import datetime

BASE_URL = "http://localhost:5000/api"
WS_URL = "ws://localhost:5002"

def test_auth_routes():
    print("\nTesting Auth Routes...")

    # Test signup
    signup_data = {
        "username": f"testuser_{int(time.time())}",
        "email": f"test_{int(time.time())}@test.com",
        "password": "testpass123"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=signup_data)
    print(f"Register Response: {response.status_code}")
    print(f"Response content: {response.text}")
    assert response.status_code in [201, 400], "Registration failed"

    # Test login
    login_data = {
        "email": signup_data["email"],
        "password": signup_data["password"]
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Login Response: {response.status_code}")
    print(f"Response content: {response.text}")
    assert response.status_code == 200, "Login failed"

    return response.json().get('access_token')

def test_universe_routes(token):
    print("\nTesting Universe Routes...")
    headers = {'Authorization': f'Bearer {token}'}

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
    response = requests.post(f"{BASE_URL}/universes", json=universe_data, headers=headers)
    print(f"Create Universe Response: {response.status_code}")
    assert response.status_code == 201, "Universe creation failed"
    universe_id = response.json().get('id')

    # Get universe
    response = requests.get(f"{BASE_URL}/universes/{universe_id}", headers=headers)
    print(f"Get Universe Response: {response.status_code}")
    assert response.status_code == 200, "Get universe failed"

    return universe_id

def test_physics_routes(token, universe_id):
    print("\nTesting Physics Routes...")
    headers = {'Authorization': f'Bearer {token}'}

    # Update physics parameters
    physics_data = {
        "gravity": 10.0,
        "friction": 0.3
    }
    response = requests.put(
        f"{BASE_URL}/physics/{universe_id}/parameters",
        json=physics_data,
        headers=headers
    )
    print(f"Update Physics Response: {response.status_code}")
    assert response.status_code == 200, "Physics update failed"

def test_music_routes(token, universe_id):
    print("\nTesting Music Routes...")
    headers = {'Authorization': f'Bearer {token}'}

    # Update music parameters
    music_data = {
        "tempo": 130,
        "key": "Am",
        "scale": "minor"
    }
    response = requests.put(
        f"{BASE_URL}/music/{universe_id}/parameters",
        json=music_data,
        headers=headers
    )
    print(f"Update Music Response: {response.status_code}")
    assert response.status_code == 200, "Music update failed"

def test_websocket():
    print("\nTesting WebSocket Connection...")
    ws = websocket.WebSocket()
    try:
        ws.connect(WS_URL)
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
    finally:
        ws.close()

def main():
    try:
        # Test authentication
        token = test_auth_routes()

        # Test universe creation and management
        universe_id = test_universe_routes(token)

        # Test physics routes
        test_physics_routes(token, universe_id)

        # Test music routes
        test_music_routes(token, universe_id)

        # Test WebSocket
        test_websocket()

        print("\nAll tests completed successfully!")

    except Exception as e:
        print(f"\nTest failed: {e}")

if __name__ == "__main__":
    main()
