"""Tests for universe routes."""
import pytest
from app.models.universe import Universe
from app.models.physics_parameters import PhysicsParameters

def test_create_universe(client, auth_headers, user):
    """Test universe creation."""
    data = {
        'name': 'Test Universe',
        'description': 'A test universe',
        'max_participants': 5,
        'is_public': True,
        'physics_parameters': {
            'gravity': 10.0,
            'time_dilation': 1.5
        }
    }

    response = client.post('/api/universes', json=data, headers=auth_headers)
    assert response.status_code == 201
    assert response.json['name'] == data['name']
    assert response.json['description'] == data['description']
    assert response.json['max_participants'] == data['max_participants']
    assert response.json['is_public'] == data['is_public']
    assert response.json['creator_id'] == user.id

    # Verify physics parameters
    universe = Universe.query.filter_by(name=data['name']).first()
    assert universe.physics_params.gravity == data['physics_parameters']['gravity']
    assert universe.physics_params.time_dilation == data['physics_parameters']['time_dilation']

def test_create_universe_invalid_data(client, auth_headers):
    """Test universe creation with invalid data."""
    data = {
        'description': 'Missing name'
    }

    response = client.post('/api/universes', json=data, headers=auth_headers)
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'Name is required' in response.json['error']

def test_get_universes(client, auth_headers, universe_factory):
    """Test getting all accessible universes."""
    # Create test universes
    public_universe = universe_factory(is_public=True)
    private_universe = universe_factory(is_public=False)

    response = client.get('/api/universes', headers=auth_headers)
    assert response.status_code == 200
    assert 'universes' in response.json

    universe_ids = [u['id'] for u in response.json['universes']]
    assert public_universe.id in universe_ids
    assert private_universe.id not in universe_ids

def test_get_my_universes(client, auth_headers, user, universe_factory):
    """Test getting user's own universes."""
    # Create test universes
    my_universe = universe_factory(creator_id=user.id)
    other_universe = universe_factory()  # Created by another user

    response = client.get('/api/universes/my', headers=auth_headers)
    assert response.status_code == 200
    assert 'universes' in response.json

    universe_ids = [u['id'] for u in response.json['universes']]
    assert my_universe.id in universe_ids
    assert other_universe.id not in universe_ids

def test_delete_universe(client, auth_headers, universe_factory):
    """Test universe deletion."""
    universe = universe_factory()

    response = client.delete(f'/api/universes/{universe.id}', headers=auth_headers)
    assert response.status_code == 204

    # Verify universe is deleted
    assert Universe.query.get(universe.id) is None
    # Verify physics parameters are deleted
    assert PhysicsParameters.query.filter_by(universe_id=universe.id).first() is None

def test_delete_universe_unauthorized(client, auth_headers, universe_factory):
    """Test deleting universe without permission."""
    universe = universe_factory()  # Created by another user

    response = client.delete(f'/api/universes/{universe.id}', headers=auth_headers)
    assert response.status_code == 403
    assert 'error' in response.json
    assert 'Access denied' in response.json['error']

def test_update_parameters(client, auth_headers, universe_factory):
    """Test updating universe parameters."""
    universe = universe_factory()
    data = {
        'parameters': {
            'gravity': 8.0,
            'time_dilation': 2.0
        }
    }

    response = client.put(f'/api/universes/{universe.id}/parameters',
                         json=data, headers=auth_headers)
    assert response.status_code == 200

    # Verify changes in database
    universe = Universe.query.get(universe.id)
    assert universe.physics_params.gravity == data['parameters']['gravity']
    assert universe.physics_params.time_dilation == data['parameters']['time_dilation']

def test_add_collaborator(client, auth_headers, universe_factory, user_factory):
    """Test adding a collaborator to a universe."""
    universe = universe_factory()
    collaborator = user_factory()
    data = {
        'email': collaborator.email
    }

    response = client.post(f'/api/universes/{universe.id}/collaborators',
                          json=data, headers=auth_headers)
    assert response.status_code == 201
    assert 'Collaborator added successfully' in response.json['message']

    # Verify collaborator was added
    universe = Universe.query.get(universe.id)
    assert collaborator in universe.collaborators

def test_add_collaborator_invalid_email(client, auth_headers, universe_factory):
    """Test adding non-existent collaborator."""
    universe = universe_factory()
    data = {
        'email': 'nonexistent@example.com'
    }

    response = client.post(f'/api/universes/{universe.id}/collaborators',
                          json=data, headers=auth_headers)
    assert response.status_code == 404
    assert 'error' in response.json
    assert 'User not found' in response.json['error']
