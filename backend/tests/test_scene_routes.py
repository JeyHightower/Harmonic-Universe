"""Tests for scene routes."""
import json
import pytest
from ..app.models import User, Universe, Storyboard, Scene

def test_get_scenes(client, auth, test_user, test_universe, test_storyboard):
    """Test getting all scenes for a storyboard."""
    auth.login()

    # Create test scenes
    scene1 = Scene(
        storyboard_id=test_storyboard.id,
        title="Test Scene 1",
        sequence=0,
        content={'key': 'value1'}
    )
    scene2 = Scene(
        storyboard_id=test_storyboard.id,
        title="Test Scene 2",
        sequence=1,
        content={'key': 'value2'}
    )
    db.session.add_all([scene1, scene2])
    db.session.commit()

    response = client.get(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes'
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert len(data) == 2
    assert data[0]['title'] == "Test Scene 1"
    assert data[1]['title'] == "Test Scene 2"
    assert data[0]['sequence'] == 0
    assert data[1]['sequence'] == 1

def test_get_scene(client, auth, test_user, test_universe, test_storyboard):
    """Test getting a specific scene."""
    auth.login()

    scene = Scene(
        storyboard_id=test_storyboard.id,
        title="Test Scene",
        sequence=0,
        content={'key': 'value'}
    )
    db.session.add(scene)
    db.session.commit()

    response = client.get(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{scene.id}'
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['title'] == "Test Scene"
    assert data['sequence'] == 0
    assert data['content'] == {'key': 'value'}

def test_create_scene(client, auth, test_user, test_universe, test_storyboard):
    """Test creating a new scene."""
    auth.login()

    scene_data = {
        'title': "New Scene",
        'sequence': 0,
        'content': {'key': 'value'}
    }

    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes',
        json=scene_data
    )
    assert response.status_code == 201

    data = json.loads(response.data)
    assert data['title'] == "New Scene"
    assert data['sequence'] == 0
    assert data['content'] == {'key': 'value'}

def test_update_scene(client, auth, test_user, test_universe, test_storyboard):
    """Test updating a scene."""
    auth.login()

    scene = Scene(
        storyboard_id=test_storyboard.id,
        title="Test Scene",
        sequence=0,
        content={'key': 'value'}
    )
    db.session.add(scene)
    db.session.commit()

    update_data = {
        'title': "Updated Scene",
        'sequence': 1,
        'content': {'key': 'updated'}
    }

    response = client.put(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{scene.id}',
        json=update_data
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['title'] == "Updated Scene"
    assert data['sequence'] == 1
    assert data['content'] == {'key': 'updated'}

def test_delete_scene(client, auth, test_user, test_universe, test_storyboard):
    """Test deleting a scene."""
    auth.login()

    scene = Scene(
        storyboard_id=test_storyboard.id,
        title="Test Scene",
        sequence=0,
        content={'key': 'value'}
    )
    db.session.add(scene)
    db.session.commit()

    response = client.delete(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{scene.id}'
    )
    assert response.status_code == 204

    # Verify scene is deleted
    scene = Scene.query.get(scene.id)
    assert scene is None

def test_reorder_scenes(client, auth, test_user, test_universe, test_storyboard):
    """Test reordering scenes."""
    auth.login()

    # Create test scenes
    scene1 = Scene(
        storyboard_id=test_storyboard.id,
        title="Scene 1",
        sequence=0,
        content={'key': 'value1'}
    )
    scene2 = Scene(
        storyboard_id=test_storyboard.id,
        title="Scene 2",
        sequence=1,
        content={'key': 'value2'}
    )
    scene3 = Scene(
        storyboard_id=test_storyboard.id,
        title="Scene 3",
        sequence=2,
        content={'key': 'value3'}
    )
    db.session.add_all([scene1, scene2, scene3])
    db.session.commit()

    # Reorder scenes: 3, 1, 2
    reorder_data = {
        'scene_ids': [scene3.id, scene1.id, scene2.id]
    }

    response = client.put(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/reorder',
        json=reorder_data
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert len(data) == 3
    assert data[0]['id'] == scene3.id
    assert data[1]['id'] == scene1.id
    assert data[2]['id'] == scene2.id
    assert data[0]['sequence'] == 0
    assert data[1]['sequence'] == 1
    assert data[2]['sequence'] == 2

def test_unauthorized_access(client, test_user, test_universe, test_storyboard):
    """Test unauthorized access to scene routes."""
    # Without login
    response = client.get(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes'
    )
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

    # Try to access scenes
    response = client.get(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes'
    )
    assert response.status_code == 403

def test_validation(client, auth, test_user, test_universe, test_storyboard):
    """Test scene data validation."""
    auth.login()

    # Test missing required fields
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes',
        json={'title': 'Scene'}
    )
    assert response.status_code == 400
    assert b'Sequence is required' in response.data

    # Test title too long
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes',
        json={
            'title': 'x' * 201,
            'sequence': 0,
            'content': {'key': 'value'}
        }
    )
    assert response.status_code == 400
    assert b'Title cannot be longer than 200 characters' in response.data

    # Test negative sequence
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes',
        json={
            'title': 'Scene',
            'sequence': -1,
            'content': {'key': 'value'}
        }
    )
    assert response.status_code == 400
    assert b'Sequence cannot be negative' in response.data

    # Test invalid content
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes',
        json={
            'title': 'Scene',
            'sequence': 0,
            'content': 'not an object'
        }
    )
    assert response.status_code == 400
    assert b'Content must be an object' in response.data
