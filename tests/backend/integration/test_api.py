import pytest
from flask import json

def test_user_flow(client):
    """Test complete user flow: register, login, get profile."""
    # Register
    register_response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert register_response.status_code == 201

    # Login
    login_response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'password123'
    })
    assert login_response.status_code == 200
    login_data = json.loads(login_response.data)
    token = login_data['access_token']

    # Get profile
    headers = {'Authorization': f'Bearer {token}'}
    profile_response = client.get('/api/profile', headers=headers)
    assert profile_response.status_code == 200
    profile_data = json.loads(profile_response.data)
    assert profile_data['username'] == 'testuser'
    assert profile_data['email'] == 'test@example.com'

def test_universe_flow(client, auth_headers):
    """Test universe creation and retrieval flow."""
    # Create universe
    create_response = client.post('/api/universes', json={
        'name': 'Test Universe',
        'description': 'A test universe'
    }, headers=auth_headers)
    assert create_response.status_code == 201
    universe_data = json.loads(create_response.data)
    universe_id = universe_data['id']

    # Get universe
    get_response = client.get(f'/api/universes/{universe_id}', headers=auth_headers)
    assert get_response.status_code == 200
    get_data = json.loads(get_response.data)
    assert get_data['name'] == 'Test Universe'
    assert get_data['description'] == 'A test universe'

    # Update universe
    update_response = client.put(f'/api/universes/{universe_id}', json={
        'name': 'Updated Universe',
        'description': 'An updated universe'
    }, headers=auth_headers)
    assert update_response.status_code == 200
    update_data = json.loads(update_response.data)
    assert update_data['name'] == 'Updated Universe'

    # Delete universe
    delete_response = client.delete(f'/api/universes/{universe_id}', headers=auth_headers)
    assert delete_response.status_code == 200

def test_collaboration_flow(client, auth_headers, test_universe):
    """Test collaboration features."""
    # Create collaboration invitation
    invite_response = client.post(f'/api/collaboration/invite', json={
        'universe_id': test_universe.id,
        'email': 'collaborator@example.com'
    }, headers=auth_headers)
    assert invite_response.status_code == 201

    # Accept invitation (would normally be done by another user)
    accept_response = client.post(f'/api/collaboration/accept', json={
        'invitation_id': json.loads(invite_response.data)['id']
    }, headers=auth_headers)
    assert accept_response.status_code == 200

    # Get collaborators
    collab_response = client.get(f'/api/universes/{test_universe.id}/collaborators',
                                headers=auth_headers)
    assert collab_response.status_code == 200
    collab_data = json.loads(collab_response.data)
    assert len(collab_data['collaborators']) > 0
