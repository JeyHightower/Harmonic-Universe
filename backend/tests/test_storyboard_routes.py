"""Tests for storyboard routes."""
import json
import pytest
from app.extensions import db
from app.models import User, Universe, Storyboard

def test_get_storyboards(client, auth, test_user, test_universe):
    """Test getting all storyboards for a universe."""
    auth.login()
    universe = test_universe()

    with client.application.app_context():
        # Create test storyboards
        storyboard1 = Storyboard(
            universe_id=universe.id,
            title="Test Storyboard 1",
            description="Description 1"
        )
        storyboard2 = Storyboard(
            universe_id=universe.id,
            title="Test Storyboard 2",
            description="Description 2"
        )
        db.session.add_all([storyboard1, storyboard2])
        db.session.commit()

        response = client.get(f'/api/universes/{universe.id}/storyboards')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert len(data) == 2
        assert data[0]['title'] == "Test Storyboard 1"
        assert data[1]['title'] == "Test Storyboard 2"

def test_get_storyboard(client, auth, test_user, test_universe):
    """Test getting a specific storyboard."""
    auth.login()
    universe = test_universe()

    with client.application.app_context():
        storyboard = Storyboard(
            universe_id=universe.id,
            title="Test Storyboard",
            description="Description"
        )
        db.session.add(storyboard)
        db.session.commit()

        response = client.get(f'/api/universes/{universe.id}/storyboards/{storyboard.id}')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data['title'] == "Test Storyboard"
        assert data['description'] == "Description"

def test_create_storyboard(client, auth, test_user, test_universe):
    """Test creating a new storyboard."""
    auth.login()
    universe = test_universe()

    response = client.post(
        f'/api/universes/{universe.id}/storyboards',
        json={
            'title': 'New Storyboard',
            'description': 'New Description',
            'metadata': {'key': 'value'}
        }
    )
    assert response.status_code == 201

    data = json.loads(response.data)
    assert data['title'] == 'New Storyboard'
    assert data['description'] == 'New Description'
    assert data['metadata'] == {'key': 'value'}

def test_update_storyboard(client, auth, test_user, test_universe, test_storyboard):
    """Test updating a storyboard."""
    auth.login()
    universe = test_universe()
    storyboard = test_storyboard()

    response = client.put(
        f'/api/universes/{universe.id}/storyboards/{storyboard.id}',
        json={
            'title': 'Updated Title',
            'description': 'Updated Description',
            'metadata': {'new': 'value'}
        }
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['title'] == 'Updated Title'
    assert data['description'] == 'Updated Description'
    assert data['metadata'] == {'new': 'value'}

def test_delete_storyboard(client, auth, test_user, test_universe, test_storyboard):
    """Test deleting a storyboard."""
    auth.login()
    universe = test_universe()
    storyboard = test_storyboard()

    response = client.delete(f'/api/universes/{universe.id}/storyboards/{storyboard.id}')
    assert response.status_code == 204

    with client.application.app_context():
        assert db.session.get(Storyboard, storyboard.id) is None

def test_unauthorized_access(client, test_user, test_universe):
    """Test unauthorized access to storyboards."""
    universe = test_universe()

    # Without login
    response = client.get(f'/api/universes/{universe.id}/storyboards')
    assert response.status_code == 401

    # Create another user
    with client.application.app_context():
        other_user = User(username='other', email='other@example.com')
        other_user.set_password('test')
        db.session.add(other_user)
        db.session.commit()

        # Login as other user
        client.post(
            '/api/auth/login',
            json={'email': 'other@example.com', 'password': 'test'}
        )

        # Try to access storyboards
        response = client.get(f'/api/universes/{universe.id}/storyboards')
        assert response.status_code == 403

def test_validation(client, auth, test_user, test_universe):
    """Test input validation for storyboards."""
    auth.login()
    universe = test_universe()

    # Test missing required fields
    response = client.post(
        f'/api/universes/{universe.id}/storyboards',
        json={}
    )
    assert response.status_code == 400

    # Test invalid metadata format
    response = client.post(
        f'/api/universes/{universe.id}/storyboards',
        json={
            'title': 'Test',
            'description': 'Test',
            'metadata': 'invalid'  # Should be a dict
        }
    )
    assert response.status_code == 400

    # Test title length validation
    response = client.post(
        f'/api/universes/{universe.id}/storyboards',
        json={
            'title': 'a' * 256,  # Too long
            'description': 'Test'
        }
    )
    assert response.status_code == 400

