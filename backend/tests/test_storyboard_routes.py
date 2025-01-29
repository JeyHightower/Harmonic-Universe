"""Tests for storyboard routes."""
import json
import pytest
from ..app.models import User, Universe, Storyboard

def test_get_storyboards(client, auth, test_user, test_universe):
    """Test getting all storyboards for a universe."""
    auth.login()

    # Create test storyboards
    storyboard1 = Storyboard(
        universe_id=test_universe.id,
        title="Test Storyboard 1",
        description="Description 1"
    )
    storyboard2 = Storyboard(
        universe_id=test_universe.id,
        title="Test Storyboard 2",
        description="Description 2"
    )
    db.session.add_all([storyboard1, storyboard2])
    db.session.commit()

    response = client.get(f'/api/universes/{test_universe.id}/storyboards')
    assert response.status_code == 200

    data = json.loads(response.data)
    assert len(data) == 2
    assert data[0]['title'] == "Test Storyboard 1"
    assert data[1]['title'] == "Test Storyboard 2"

def test_get_storyboard(client, auth, test_user, test_universe):
    """Test getting a specific storyboard."""
    auth.login()

    storyboard = Storyboard(
        universe_id=test_universe.id,
        title="Test Storyboard",
        description="Description"
    )
    db.session.add(storyboard)
    db.session.commit()

    response = client.get(f'/api/universes/{test_universe.id}/storyboards/{storyboard.id}')
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['title'] == "Test Storyboard"
    assert data['description'] == "Description"

def test_create_storyboard(client, auth, test_user, test_universe):
    """Test creating a new storyboard."""
    auth.login()

    storyboard_data = {
        'title': "New Storyboard",
        'description': "New Description",
        'metadata': {'key': 'value'}
    }

    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards',
        json=storyboard_data
    )
    assert response.status_code == 201

    data = json.loads(response.data)
    assert data['title'] == "New Storyboard"
    assert data['description'] == "New Description"
    assert data['metadata'] == {'key': 'value'}

def test_update_storyboard(client, auth, test_user, test_universe):
    """Test updating a storyboard."""
    auth.login()

    storyboard = Storyboard(
        universe_id=test_universe.id,
        title="Test Storyboard",
        description="Description"
    )
    db.session.add(storyboard)
    db.session.commit()

    update_data = {
        'title': "Updated Storyboard",
        'description': "Updated Description"
    }

    response = client.put(
        f'/api/universes/{test_universe.id}/storyboards/{storyboard.id}',
        json=update_data
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['title'] == "Updated Storyboard"
    assert data['description'] == "Updated Description"

def test_delete_storyboard(client, auth, test_user, test_universe):
    """Test deleting a storyboard."""
    auth.login()

    storyboard = Storyboard(
        universe_id=test_universe.id,
        title="Test Storyboard",
        description="Description"
    )
    db.session.add(storyboard)
    db.session.commit()

    response = client.delete(f'/api/universes/{test_universe.id}/storyboards/{storyboard.id}')
    assert response.status_code == 204

    # Verify storyboard is deleted
    storyboard = Storyboard.query.get(storyboard.id)
    assert storyboard is None

def test_unauthorized_access(client, test_user, test_universe):
    """Test unauthorized access to storyboard routes."""
    # Without login
    response = client.get(f'/api/universes/{test_universe.id}/storyboards')
    assert response.status_code == 401

    # Create another user who doesn't own the universe
    other_user = User(username="other", email="other@example.com")
    other_user.set_password("password")
    db.session.add(other_user)
    db.session.commit()

    # Login as other user
    client.post('/api/auth/login', json={
        'email': 'other@example.com',
        'password': 'password'
    })

    # Try to access storyboards
    response = client.get(f'/api/universes/{test_universe.id}/storyboards')
    assert response.status_code == 403

def test_validation(client, auth, test_user, test_universe):
    """Test storyboard data validation."""
    auth.login()

    # Test missing title
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards',
        json={'description': 'Description'}
    )
    assert response.status_code == 400
    assert b'Title is required' in response.data

    # Test title too long
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards',
        json={'title': 'x' * 201, 'description': 'Description'}
    )
    assert response.status_code == 400
    assert b'Title cannot be longer than 200 characters' in response.data

    # Test description too long
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards',
        json={'title': 'Title', 'description': 'x' * 1001}
    )
    assert response.status_code == 400
    assert b'Description cannot be longer than 1000 characters' in response.data

    # Test invalid metadata
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards',
        json={'title': 'Title', 'metadata': 'not an object'}
    )
    assert response.status_code == 400
    assert b'Metadata must be an object' in response.data

