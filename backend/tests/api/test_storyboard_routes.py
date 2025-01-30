"""Tests for storyboard routes."""
import json
import pytest
from app.models import Storyboard, Universe, User
from app.extensions import db

def test_create_storyboard(client, auth, test_universe):
    """Test creating a storyboard."""
    auth.login()

    response = client.post(f'/api/universes/{test_universe.id}/storyboards', json={
        'name': 'Test Storyboard',
        'description': 'A test storyboard'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Test Storyboard'
    assert data['description'] == 'A test storyboard'
    assert data['universe_id'] == test_universe.id

def test_get_storyboard(client, auth, test_universe):
    """Test getting a storyboard."""
    auth.login()

    # Create test storyboard
    storyboard = Storyboard(
        name='Test Storyboard',
        description='A test storyboard',
        universe_id=test_universe.id
    )
    db.session.add(storyboard)
    db.session.commit()

    response = client.get(f'/api/storyboards/{storyboard.id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Test Storyboard'
    assert data['description'] == 'A test storyboard'

def test_update_storyboard(client, auth, test_universe):
    """Test updating a storyboard."""
    auth.login()

    # Create test storyboard
    storyboard = Storyboard(
        name='Test Storyboard',
        description='A test storyboard',
        universe_id=test_universe.id
    )
    db.session.add(storyboard)
    db.session.commit()

    response = client.put(f'/api/storyboards/{storyboard.id}', json={
        'name': 'Updated Storyboard',
        'description': 'An updated storyboard'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Updated Storyboard'
    assert data['description'] == 'An updated storyboard'

def test_delete_storyboard(client, auth, test_universe):
    """Test deleting a storyboard."""
    auth.login()

    # Create test storyboard
    storyboard = Storyboard(
        name='Test Storyboard',
        description='A test storyboard',
        universe_id=test_universe.id
    )
    db.session.add(storyboard)
    db.session.commit()

    response = client.delete(f'/api/storyboards/{storyboard.id}')
    assert response.status_code == 204

    # Verify storyboard is deleted
    assert Storyboard.query.get(storyboard.id) is None

def test_list_storyboards(client, auth, test_universe):
    """Test listing storyboards."""
    auth.login()

    # Create test storyboards
    storyboard1 = Storyboard(
        name='Storyboard 1',
        description='First storyboard',
        universe_id=test_universe.id
    )
    storyboard2 = Storyboard(
        name='Storyboard 2',
        description='Second storyboard',
        universe_id=test_universe.id
    )
    db.session.add_all([storyboard1, storyboard2])
    db.session.commit()

    response = client.get(f'/api/universes/{test_universe.id}/storyboards')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 2
    assert data[0]['name'] == 'Storyboard 1'
    assert data[1]['name'] == 'Storyboard 2'

def test_unauthorized_access(client, auth, test_universe):
    """Test unauthorized access to storyboard endpoints."""
    # Create test storyboard
    storyboard = Storyboard(
        name='Test Storyboard',
        description='A test storyboard',
        universe_id=test_universe.id
    )
    db.session.add(storyboard)
    db.session.commit()

    # Try accessing without login
    response = client.get(f'/api/storyboards/{storyboard.id}')
    assert response.status_code == 401

    # Login as different user
    auth.register('other', 'other@example.com', 'password')
    auth.login('other', 'password')

    # Try accessing another user's storyboard
    response = client.get(f'/api/storyboards/{storyboard.id}')
    assert response.status_code == 403

def test_validation_errors(client, auth, test_universe):
    """Test validation errors in storyboard endpoints."""
    auth.login()

    # Test missing required fields
    response = client.post(f'/api/universes/{test_universe.id}/storyboards', json={})
    assert response.status_code == 400
    assert 'error' in json.loads(response.data)

    # Test invalid field values
    response = client.post(f'/api/universes/{test_universe.id}/storyboards', json={
        'name': '',  # Empty name
        'description': 'A test storyboard'
    })
    assert response.status_code == 400
    assert 'error' in json.loads(response.data)
