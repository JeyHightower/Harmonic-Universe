import pytest
from app.models import Universe
from ..factories import UniverseFactory, UserFactory

def test_get_universes(client, auth_headers, test_user):
    """Test getting list of universes"""
    # Create test universes
    universes = [
        UniverseFactory(creator=test_user),
        UniverseFactory(creator=test_user),
        UniverseFactory(creator=test_user)
    ]

    response = client.get('/api/universes', headers=auth_headers)
    assert response.status_code == 200

    data = response.json
    assert len(data['universes']) == 3
    assert all(u['creator_id'] == test_user.id for u in data['universes'])

def test_get_universe_detail(client, auth_headers, test_user):
    """Test getting a specific universe"""
    universe = UniverseFactory(creator=test_user)

    response = client.get(f'/api/universes/{universe.id}', headers=auth_headers)
    assert response.status_code == 200

    data = response.json
    assert data['id'] == universe.id
    assert data['name'] == universe.name
    assert data['description'] == universe.description
    assert data['creator_id'] == test_user.id

def test_create_universe(client, auth_headers):
    """Test creating a new universe"""
    data = {
        'name': 'New Test Universe',
        'description': 'A test universe created through API'
    }

    response = client.post('/api/universes', json=data, headers=auth_headers)
    assert response.status_code == 201

    created = response.json
    assert created['name'] == data['name']
    assert created['description'] == data['description']

def test_update_universe(client, auth_headers, test_user):
    """Test updating an existing universe"""
    universe = UniverseFactory(creator=test_user)

    update_data = {
        'name': 'Updated Universe Name',
        'description': 'Updated universe description'
    }

    response = client.put(
        f'/api/universes/{universe.id}',
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 200

    updated = response.json
    assert updated['name'] == update_data['name']
    assert updated['description'] == update_data['description']

def test_delete_universe(client, auth_headers, test_user):
    """Test deleting a universe"""
    universe = UniverseFactory(creator=test_user)

    response = client.delete(
        f'/api/universes/{universe.id}',
        headers=auth_headers
    )
    assert response.status_code == 204

    # Verify deletion
    response = client.get(f'/api/universes/{universe.id}', headers=auth_headers)
    assert response.status_code == 404

def test_unauthorized_update(client, auth_headers):
    """Test attempting to update someone else's universe"""
    other_user = UserFactory()
    universe = UniverseFactory(creator=other_user)

    update_data = {
        'name': 'Unauthorized Update',
        'description': 'Should not work'
    }

    response = client.put(
        f'/api/universes/{universe.id}',
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 403

def test_unauthorized_delete(client, auth_headers):
    """Test attempting to delete someone else's universe"""
    other_user = UserFactory()
    universe = UniverseFactory(creator=other_user)

    response = client.delete(
        f'/api/universes/{universe.id}',
        headers=auth_headers
    )
    assert response.status_code == 403
