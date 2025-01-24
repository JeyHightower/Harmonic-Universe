"""Universe management tests."""
import pytest
from app.models import Universe, PhysicsParameters

def test_create_universe(client, auth_headers):
    """Test universe creation."""
    response = client.post('/api/universes', json={
        'name': 'New Universe',
        'description': 'A test universe',
        'is_public': True,
        'physics_parameters': {
            'gravity': 9.81,
            'particle_speed': 1.0
        }
    }, headers=auth_headers)
    assert response.status_code == 201
    assert response.json['name'] == 'New Universe'
    assert 'physics_parameters' in response.json

def test_get_universe(client, auth_headers, test_universe):
    """Test getting universe details."""
    response = client.get(f'/api/universes/{test_universe.id}', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['name'] == test_universe.name
    assert 'physics_parameters' in response.json

def test_list_universes(client, auth_headers, test_universe):
    """Test listing universes."""
    response = client.get('/api/universes', headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) > 0
    assert response.json[0]['name'] == test_universe.name

def test_update_universe(client, auth_headers, test_universe):
    """Test updating universe."""
    response = client.put(f'/api/universes/{test_universe.id}', json={
        'name': 'Updated Universe',
        'description': 'Updated description',
        'physics_parameters': {
            'gravity': 10.0,
            'particle_speed': 2.0
        }
    }, headers=auth_headers)
    assert response.status_code == 200
    assert response.json['name'] == 'Updated Universe'
    assert response.json['physics_parameters']['gravity'] == 10.0

def test_delete_universe(client, auth_headers, test_universe):
    """Test deleting universe."""
    response = client.delete(f'/api/universes/{test_universe.id}', headers=auth_headers)
    assert response.status_code == 204

    # Verify universe is deleted
    response = client.get(f'/api/universes/{test_universe.id}', headers=auth_headers)
    assert response.status_code == 404

def test_universe_privacy(client, auth_headers, test_universe):
    """Test universe privacy settings."""
    # Make universe private
    response = client.put(f'/api/universes/{test_universe.id}', json={
        'is_public': False
    }, headers=auth_headers)
    assert response.status_code == 200
    assert not response.json['is_public']

    # Create another user
    client.post('/api/auth/register', json={
        'username': 'another',
        'email': 'another@example.com',
        'password': 'password123'
    })
    response = client.post('/api/auth/login', json={
        'email': 'another@example.com',
        'password': 'password123'
    })
    other_headers = {'Authorization': f'Bearer {response.json["token"]}'}

    # Try accessing private universe with other user
    response = client.get(f'/api/universes/{test_universe.id}', headers=other_headers)
    assert response.status_code == 403

def test_physics_parameters(client, auth_headers, test_universe):
    """Test physics parameters management."""
    # Update physics parameters
    response = client.put(f'/api/universes/{test_universe.id}/physics', json={
        'gravity': 15.0,
        'particle_speed': 3.0
    }, headers=auth_headers)
    assert response.status_code == 200
    assert response.json['gravity'] == 15.0

    # Get physics parameters
    response = client.get(f'/api/universes/{test_universe.id}/physics', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['gravity'] == 15.0
    assert response.json['particle_speed'] == 3.0

def test_invalid_physics_parameters(client, auth_headers, test_universe):
    """Test invalid physics parameters."""
    response = client.put(f'/api/universes/{test_universe.id}/physics', json={
        'gravity': -1.0,  # Invalid negative gravity
        'particle_speed': 3.0
    }, headers=auth_headers)
    assert response.status_code == 400
    assert 'error' in response.json
