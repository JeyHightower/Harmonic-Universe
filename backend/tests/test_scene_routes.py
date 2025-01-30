"""Tests for scene routes."""
import json
import pytest
from app.extensions import db
from app.models import Scene, User

def test_get_scenes(client, auth, test_user, test_universe, test_storyboard):
    """Test getting all scenes for a storyboard."""
    auth.login()
    universe = test_universe()
    storyboard = test_storyboard()

    with client.application.app_context():
        # Create test scenes
        scene1 = Scene(
            storyboard_id=storyboard.id,
            title="Test Scene 1",
            sequence=1,
            content={'key': 'value1'}
        )
        scene2 = Scene(
            storyboard_id=storyboard.id,
            title="Test Scene 2",
            sequence=2,
            content={'key': 'value2'}
        )
        db.session.add_all([scene1, scene2])
        db.session.commit()

        response = client.get(f'/api/universes/{universe.id}/storyboards/{storyboard.id}/scenes')
        assert response.status_code == 200

        data = json.loads(response.data)
        assert len(data) == 2
        assert data[0]['title'] == "Test Scene 1"
        assert data[1]['title'] == "Test Scene 2"
        assert data[0]['content'] == {'key': 'value1'}
        assert data[1]['content'] == {'key': 'value2'}

def test_get_scene(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test getting a specific scene."""
    auth.login()
    universe = test_universe()
    storyboard = test_storyboard()
    scene = test_scene()

    response = client.get(
        f'/api/universes/{universe.id}/storyboards/{storyboard.id}/scenes/{scene.id}'
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['title'] == "Test Scene"
    assert data['content'] == {'key': 'value'}

def test_create_scene(client, auth, test_user, test_universe, test_storyboard):
    """Test creating a new scene."""
    auth.login()
    universe = test_universe()
    storyboard = test_storyboard()

    response = client.post(
        f'/api/universes/{universe.id}/storyboards/{storyboard.id}/scenes',
        json={
            'title': 'New Scene',
            'sequence': 1,
            'content': {'key': 'value'}
        }
    )
    assert response.status_code == 201

    data = json.loads(response.data)
    assert data['title'] == 'New Scene'
    assert data['sequence'] == 1
    assert data['content'] == {'key': 'value'}

def test_update_scene(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test updating a scene."""
    auth.login()
    universe = test_universe()
    storyboard = test_storyboard()
    scene = test_scene()

    response = client.put(
        f'/api/universes/{universe.id}/storyboards/{storyboard.id}/scenes/{scene.id}',
        json={
            'title': 'Updated Title',
            'sequence': 2,
            'content': {'key': 'updated'}
        }
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['title'] == 'Updated Title'
    assert data['sequence'] == 2
    assert data['content'] == {'key': 'updated'}

def test_delete_scene(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test deleting a scene."""
    auth.login()
    universe = test_universe()
    storyboard = test_storyboard()
    scene = test_scene()

    response = client.delete(
        f'/api/universes/{universe.id}/storyboards/{storyboard.id}/scenes/{scene.id}'
    )
    assert response.status_code == 204

    with client.application.app_context():
        assert db.session.get(Scene, scene.id) is None

def test_reorder_scenes(client, auth, test_user, test_universe, test_storyboard):
    """Test reordering scenes."""
    auth.login()
    universe = test_universe()
    storyboard = test_storyboard()

    with client.application.app_context():
        # Create multiple scenes
        scene1 = Scene(
            storyboard_id=storyboard.id,
            title="Scene 1",
            sequence=1,
            content={'key': 'value1'}
        )
        scene2 = Scene(
            storyboard_id=storyboard.id,
            title="Scene 2",
            sequence=2,
            content={'key': 'value2'}
        )
        scene3 = Scene(
            storyboard_id=storyboard.id,
            title="Scene 3",
            sequence=3,
            content={'key': 'value3'}
        )
        db.session.add_all([scene1, scene2, scene3])
        db.session.commit()

        # Reorder scenes
        response = client.put(
            f'/api/universes/{universe.id}/storyboards/{storyboard.id}/scenes/reorder',
            json={
                'scene_order': [scene3.id, scene1.id, scene2.id]
            }
        )
        assert response.status_code == 200

        # Verify new order
        scenes = Scene.query.filter_by(storyboard_id=storyboard.id).order_by(Scene.sequence).all()
        assert scenes[0].id == scene3.id
        assert scenes[1].id == scene1.id
        assert scenes[2].id == scene2.id

def test_unauthorized_access(client, test_user, test_universe, test_storyboard, test_scene):
    """Test unauthorized access to scenes."""
    universe = test_universe()
    storyboard = test_storyboard()
    scene = test_scene()

    # Without login
    response = client.get(
        f'/api/universes/{universe.id}/storyboards/{storyboard.id}/scenes'
    )
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

        # Try to access scenes
        response = client.get(
            f'/api/universes/{universe.id}/storyboards/{storyboard.id}/scenes'
        )
        assert response.status_code == 403

def test_validation(client, auth, test_user, test_universe, test_storyboard):
    """Test input validation for scenes."""
    auth.login()
    universe = test_universe()
    storyboard = test_storyboard()

    # Test missing required fields
    response = client.post(
        f'/api/universes/{universe.id}/storyboards/{storyboard.id}/scenes',
        json={}
    )
    assert response.status_code == 400

    # Test invalid content format
    response = client.post(
        f'/api/universes/{universe.id}/storyboards/{storyboard.id}/scenes',
        json={
            'title': 'Test',
            'sequence': 1,
            'content': 'invalid'  # Should be a dict
        }
    )
    assert response.status_code == 400

    # Test title length validation
    response = client.post(
        f'/api/universes/{universe.id}/storyboards/{storyboard.id}/scenes',
        json={
            'title': 'a' * 256,  # Too long
            'sequence': 1,
            'content': {'key': 'value'}
        }
    )
    assert response.status_code == 400
