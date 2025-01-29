"""Tests for universe routes."""
import pytest
from app.models.universe import Universe
from app.models.user import User

def test_create_universe(client, auth_headers):
    """Test creating a new universe."""
    data = {
        'name': 'Test Universe',
        'description': 'A test universe',
        'is_public': True,
        'max_participants': 5
    }

    response = client.post('/api/universes', json=data, headers=auth_headers)
    assert response.status_code == 201

    # Verify response data
    json_data = response.get_json()
    assert json_data['name'] == data['name']
    assert json_data['description'] == data['description']
    assert json_data['is_public'] == data['is_public']
    assert json_data['max_participants'] == data['max_participants']

def test_delete_universe(client, auth_headers, universe_factory, user):
    """Test deleting a universe."""
    universe = universe_factory(user_id=user.id)
    response = client.delete(f'/api/universes/{universe.id}', headers=auth_headers)
    assert response.status_code == 204

    # Verify universe is deleted
    assert Universe.query.get(universe.id) is None

def test_update_universe(client, auth_headers, universe_factory, user):
    """Test updating a universe."""
    universe = universe_factory(user_id=user.id)
    data = {
        'name': 'Updated Universe',
        'description': 'Updated description',
        'is_public': False,
        'max_participants': 10
    }

    response = client.put(f'/api/universes/{universe.id}', json=data, headers=auth_headers)
    assert response.status_code == 200

    # Verify response data
    json_data = response.get_json()
    assert json_data['name'] == data['name']
    assert json_data['description'] == data['description']
    assert json_data['is_public'] == data['is_public']
    assert json_data['max_participants'] == data['max_participants']

def test_get_universe(client, auth_headers, universe_factory, user):
    """Test getting a specific universe."""
    universe = universe_factory(user_id=user.id)
    response = client.get(f'/api/universes/{universe.id}', headers=auth_headers)
    assert response.status_code == 200

    # Verify response data
    json_data = response.get_json()
    assert json_data['name'] == universe.name
    assert json_data['description'] == universe.description
    assert json_data['is_public'] == universe.is_public

def test_get_universes(client, auth_headers, universe_factory, user):
    """Test getting all accessible universes."""
    # Create some test universes
    universe1 = universe_factory(user_id=user.id, name='Universe 1')
    universe2 = universe_factory(user_id=user.id, name='Universe 2')

    response = client.get('/api/universes', headers=auth_headers)
    assert response.status_code == 200

    # Verify response data
    json_data = response.get_json()
    assert len(json_data['universes']) >= 2
    universe_names = [u['name'] for u in json_data['universes']]
    assert 'Universe 1' in universe_names
    assert 'Universe 2' in universe_names

def test_add_collaborator(client, auth_headers, universe_factory, user_factory, user):
    """Test adding a collaborator to a universe."""
    universe = universe_factory(user_id=user.id)
    collaborator = user_factory(username='collaborator', email='collab@example.com')

    data = {'email': collaborator.email}
    response = client.post(f'/api/universes/{universe.id}/collaborators',
                         json=data, headers=auth_headers)
    assert response.status_code == 201

    # Verify collaborator was added
    assert collaborator in universe.collaborators

def test_remove_collaborator(client, auth_headers, universe_factory, user_factory, user):
    """Test removing a collaborator from a universe."""
    universe = universe_factory(user_id=user.id)
    collaborator = user_factory(username='collaborator', email='collab@example.com')
    universe.collaborators.append(collaborator)

    response = client.delete(f'/api/universes/{universe.id}/collaborators/{collaborator.id}',
                          headers=auth_headers)
    assert response.status_code == 200

    # Verify collaborator was removed
    assert collaborator not in universe.collaborators
