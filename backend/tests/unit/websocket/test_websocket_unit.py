import pytest
import json
import asyncio
from websockets import connect
from app.models import Universe, User
from app.extensions import db

@pytest.mark.asyncio
async def test_websocket_connection(test_server, auth_headers):
    """Test WebSocket connection and authentication."""
    uri = "ws://localhost:5000/ws"
    token = auth_headers['Authorization'].split()[1]

    async with connect(f"{uri}?token={token}") as websocket:
        # Test connection is established
        greeting = await websocket.recv()
        greeting_data = json.loads(greeting)
        assert greeting_data['type'] == 'connection_established'

async def test_parameter_update_broadcast(test_server, auth_headers, session):
    """Test broadcasting parameter updates to connected clients."""
    # Create test universe
    universe = Universe(
        title='WebSocket Test Universe',
        description='Testing WebSocket updates',
        user_id=1,
        visibility='public'
    )
    session.add(universe)
    session.commit()

    uri = "ws://localhost:5000/ws"
    token = auth_headers['Authorization'].split()[1]

    async with connect(f"{uri}?token={token}") as websocket:
        # Subscribe to universe updates
        subscribe_message = {
            'type': 'subscribe',
            'universe_id': universe.id
        }
        await websocket.send(json.dumps(subscribe_message))

        # Send parameter update
        update_message = {
            'type': 'parameter_update',
            'universe_id': universe.id,
            'physics_params': {
                'gravity': 5.0
            }
        }
        await websocket.send(json.dumps(update_message))

        # Receive broadcast message
        response = await websocket.recv()
        response_data = json.loads(response)
        assert response_data['type'] == 'parameter_update'
        assert response_data['physics_params']['gravity'] == 5.0

async def test_multiple_client_broadcast(test_server, auth_headers, session):
    """Test broadcasting updates to multiple connected clients."""
    # Create test universe
    universe = Universe(
        title='Multi-Client Test Universe',
        description='Testing multi-client updates',
        user_id=1,
        visibility='public'
    )
    session.add(universe)
    session.commit()

    uri = "ws://localhost:5000/ws"
    token = auth_headers['Authorization'].split()[1]

    async with connect(f"{uri}?token={token}") as client1, \
              connect(f"{uri}?token={token}") as client2:

        # Subscribe both clients
        subscribe_message = {
            'type': 'subscribe',
            'universe_id': universe.id
        }
        await client1.send(json.dumps(subscribe_message))
        await client2.send(json.dumps(subscribe_message))

        # Send update from client1
        update_message = {
            'type': 'parameter_update',
            'universe_id': universe.id,
            'music_params': {
                'tempo': 140
            }
        }
        await client1.send(json.dumps(update_message))

        # Both clients should receive the update
        response1 = await client1.recv()
        response2 = await client2.recv()

        response1_data = json.loads(response1)
        response2_data = json.loads(response2)

        assert response1_data['music_params']['tempo'] == 140
        assert response2_data['music_params']['tempo'] == 140

async def test_client_disconnect_handling(test_server, auth_headers, session):
    """Test proper handling of client disconnections."""
    uri = "ws://localhost:5000/ws"
    token = auth_headers['Authorization'].split()[1]

    # Connect and immediately disconnect
    async with connect(f"{uri}?token={token}") as websocket:
        greeting = await websocket.recv()
        greeting_data = json.loads(greeting)
        assert greeting_data['type'] == 'connection_established'

    # Reconnect to verify server is still accepting connections
    async with connect(f"{uri}?token={token}") as websocket:
        greeting = await websocket.recv()
        greeting_data = json.loads(greeting)
        assert greeting_data['type'] == 'connection_established'

async def test_invalid_message_handling(test_server, auth_headers):
    """Test handling of invalid WebSocket messages."""
    uri = "ws://localhost:5000/ws"
    token = auth_headers['Authorization'].split()[1]

    async with connect(f"{uri}?token={token}") as websocket:
        # Send invalid JSON
        await websocket.send("invalid json")
        response = await websocket.recv()
        response_data = json.loads(response)
        assert response_data['type'] == 'error'
        assert 'invalid_json' in response_data['error']

        # Send message with missing required fields
        await websocket.send(json.dumps({'type': 'parameter_update'}))
        response = await websocket.recv()
        response_data = json.loads(response)
        assert response_data['type'] == 'error'
        assert 'missing_fields' in response_data['error']

async def test_authentication_failure(test_server):
    """Test WebSocket connection with invalid authentication."""
    uri = "ws://localhost:5000/ws"

    # Test with invalid token
    try:
        async with connect(f"{uri}?token=invalid_token"):
            assert False, "Should not connect with invalid token"
    except Exception as e:
        assert "401" in str(e)

    # Test with missing token
    try:
        async with connect(uri):
            assert False, "Should not connect without token"
    except Exception as e:
        assert "401" in str(e)
