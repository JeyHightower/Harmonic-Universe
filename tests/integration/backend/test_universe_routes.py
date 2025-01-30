import json
import pytest
from backend.app.models import Universe
from tests.factories import UniverseFactory, UserFactory

def test_get_universes(client, user, auth_headers):
    """Test getting all universes for a user."""
    # Create some test universes
    universes = [UniverseFactory(user=user) for _ in range(3)]

    # Create a universe for another user (shouldn't be returned)
    other_user = UserFactory()
    UniverseFactory(user=other_user)

    response = client.get('/api/universes', headers=auth_headers)
    assert response.status_code == 200

    data = json.loads(response.data)
    assert len(data['universes']) == 3
    assert all(u['user_id'] == user.id for u in data['universes'])

def test_get_universe(client, universe, auth_headers):
    """Test getting a specific universe."""
    response = client.get(f'/api/universes/{universe.id}', headers=auth_headers)
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['id'] == universe.id
    assert data['name'] == universe.name
    assert data['description'] == universe.description

def test_get_nonexistent_universe(client, auth_headers):
    """Test getting a universe that doesn't exist."""
    response = client.get('/api/universes/999', headers=auth_headers)
    assert response.status_code == 404

def test_create_universe(client, auth_headers):
    """Test creating a new universe."""
    data = {
        'name': 'New Universe',
        'description': 'A new test universe'
    }

    response = client.post(
        '/api/universes',
        data=json.dumps(data),
        content_type='application/json',
        headers=auth_headers
    )
    assert response.status_code == 201

    data = json.loads(response.data)
    assert data['name'] == 'New Universe'
    assert data['description'] == 'A new test universe'

def test_create_universe_validation(client, auth_headers):
    """Test universe creation validation."""
    # Test missing required field
    data = {'description': 'Missing name'}
    response = client.post(
        '/api/universes',
        data=json.dumps(data),
        content_type='application/json',
        headers=auth_headers
    )
    assert response.status_code == 400

def test_update_universe(client, universe, auth_headers):
    """Test updating a universe."""
    data = {
        'name': 'Updated Universe',
        'description': 'An updated description'
    }

    response = client.put(
        f'/api/universes/{universe.id}',
        data=json.dumps(data),
        content_type='application/json',
        headers=auth_headers
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['name'] == 'Updated Universe'
    assert data['description'] == 'An updated description'

def test_delete_universe(client, universe, auth_headers, session):
    """Test deleting a universe."""
    universe_id = universe.id
    response = client.delete(f'/api/universes/{universe_id}', headers=auth_headers)
    assert response.status_code == 204

    # Verify universe is deleted from database
    assert Universe.query.get(universe_id) is None

def test_unauthorized_access(client, universe):
    """Test unauthorized access to universe endpoints."""
    # Try without auth headers
    response = client.get('/api/universes')
    assert response.status_code == 401

    # Try with invalid token
    invalid_headers = {'Authorization': 'Bearer invalid_token'}
    response = client.get('/api/universes', headers=invalid_headers)
    assert response.status_code == 422

def test_forbidden_access(client, universe):
    """Test forbidden access to another user's universe."""
    # Create a different user and get their auth token
    other_user = UserFactory()
    from flask_jwt_extended import create_access_token
    token = create_access_token(identity=other_user.id)
    headers = {'Authorization': f'Bearer {token}'}

    # Try to access universe owned by first user
    response = client.get(f'/api/universes/{universe.id}', headers=headers)
    assert response.status_code == 403
