"""Tests for universe routes."""
import json
import pytest
from app.models import Universe, User
from app.extensions import db

def test_create_universe(client, auth):
    """Test creating a universe."""
    auth.register()
    auth.login()

    response = client.post('/api/universes', json={
        'name': 'Test Universe',
        'description': 'A test universe',
        'is_public': True
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Test Universe'
    assert data['description'] == 'A test universe'
    assert data['is_public'] is True

def test_get_universe(client, auth):
    """Test getting a universe."""
    auth.register()
    auth.login()

    # Create test universe
    user = User.query.filter_by(username='test').first()
    universe = Universe(
        name='Test Universe',
        description='A test universe',
        is_public=True,
        user_id=user.id
    )
    db.session.add(universe)
    db.session.commit()

    response = client.get(f'/api/universes/{universe.id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Test Universe'
    assert data['description'] == 'A test universe'

def test_update_universe(client, auth):
    """Test updating a universe."""
    auth.register()
    auth.login()

    # Create test universe
    user = User.query.filter_by(username='test').first()
    universe = Universe(
        name='Test Universe',
        description='A test universe',
        is_public=True,
        user_id=user.id
    )
    db.session.add(universe)
    db.session.commit()

    response = client.put(f'/api/universes/{universe.id}', json={
        'name': 'Updated Universe',
        'description': 'An updated universe'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Updated Universe'
    assert data['description'] == 'An updated universe'

def test_delete_universe(client, auth):
    """Test deleting a universe."""
    auth.register()
    auth.login()

    # Create test universe
    user = User.query.filter_by(username='test').first()
    universe = Universe(
        name='Test Universe',
        description='A test universe',
        is_public=True,
        user_id=user.id
    )
    db.session.add(universe)
    db.session.commit()

    response = client.delete(f'/api/universes/{universe.id}')
    assert response.status_code == 204

    # Verify universe is deleted
    assert Universe.query.get(universe.id) is None

def test_list_universes(client, auth):
    """Test listing universes."""
    auth.register()
    auth.login()

    # Create test universes
    user = User.query.filter_by(username='test').first()
    universe1 = Universe(
        name='Universe 1',
        description='First universe',
        is_public=True,
        user_id=user.id
    )
    universe2 = Universe(
        name='Universe 2',
        description='Second universe',
        is_public=False,
        user_id=user.id
    )
    db.session.add_all([universe1, universe2])
    db.session.commit()

    # Test listing all universes
    response = client.get('/api/universes')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 2

    # Test listing public universes only
    response = client.get('/api/universes?public=true')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 1
    assert data[0]['name'] == 'Universe 1'

def test_unauthorized_access(client, auth):
    """Test unauthorized access to universe endpoints."""
    # Create test user and universe
    auth.register()
    auth.login()
    user = User.query.filter_by(username='test').first()
    universe = Universe(
        name='Test Universe',
        description='A test universe',
        is_public=False,
        user_id=user.id
    )
    db.session.add(universe)
    db.session.commit()
    auth.logout()

    # Try accessing without login
    response = client.get(f'/api/universes/{universe.id}')
    assert response.status_code == 401

    # Login as different user
    auth.register('other', 'other@example.com', 'password')
    auth.login('other', 'password')

    # Try accessing private universe
    response = client.get(f'/api/universes/{universe.id}')
    assert response.status_code == 403

def test_validation_errors(client, auth):
    """Test validation errors in universe endpoints."""
    auth.register()
    auth.login()

    # Test missing required fields
    response = client.post('/api/universes', json={})
    assert response.status_code == 400
    assert 'error' in json.loads(response.data)

    # Test invalid field values
    response = client.post('/api/universes', json={
        'name': '',  # Empty name
        'description': 'A test universe',
        'is_public': True
    })
    assert response.status_code == 400
    assert 'error' in json.loads(response.data)
