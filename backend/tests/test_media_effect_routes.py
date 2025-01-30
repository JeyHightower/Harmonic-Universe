"""Tests for media effect routes."""
import json
import pytest
from flask import current_app
from app.extensions import db
from app.models import User, VisualEffect, AudioTrack, Scene, Storyboard, Universe
from flask_jwt_extended import create_access_token, decode_token

@pytest.fixture(scope='function')
def setup_test_environment(app, client, test_user, auth_headers):
    """Set up test environment with authenticated user and test data."""
    with app.app_context():
        # Ensure test_user is attached to the session
        user = db.session.merge(test_user)
        db.session.flush()

        # Create test universe
        universe = Universe(
            name='Test Universe',
            description='Test Description',
            user_id=user.id,
            is_public=True
        )
        db.session.add(universe)
        db.session.flush()

        # Create test storyboard
        storyboard = Storyboard(
            universe_id=universe.id,
            name='Test Storyboard',
            description='Test Description'
        )
        db.session.add(storyboard)
        db.session.flush()

        # Create test scene
        scene = Scene(
            storyboard_id=storyboard.id,
            name='Test Scene',
            sequence=1,
            content={'key': 'value'}
        )
        db.session.add(scene)
        db.session.flush()

        # Create test visual effect
        visual_effect = VisualEffect(
            scene_id=scene.id,
            name='Test Effect',
            effect_type='fade',
            parameters={'duration': 1.0}
        )
        db.session.add(visual_effect)
        db.session.flush()

        # Create test audio track
        audio_track = AudioTrack(
            scene_id=scene.id,
            name='Test Track',
            track_type='music',
            parameters={'volume': 0.8}
        )
        db.session.add(audio_track)

        # Commit all changes
        db.session.commit()

        # Store test data using the provided auth_headers
        test_data = {
            'app': app,
            'client': client,
            'headers': auth_headers,  # Use the fixture's headers
            'user': user,
            'universe': universe,
            'storyboard': storyboard,
            'scene': scene,
            'visual_effect': visual_effect,
            'audio_track': audio_track
        }

        yield test_data

        # Cleanup
        db.session.rollback()
        db.session.query(AudioTrack).delete()
        db.session.query(VisualEffect).delete()
        db.session.query(Scene).delete()
        db.session.query(Storyboard).delete()
        db.session.query(Universe).delete()
        db.session.commit()

def test_get_visual_effects(setup_test_environment):
    """Test getting visual effects."""
    env = setup_test_environment
    app = env['app']
    client = env['client']
    headers = env['headers']
    scene = env['scene']

    with app.app_context():
        # Ensure scene is attached to session
        scene = db.session.merge(scene)
        db.session.flush()

        response = client.get(
            f'/api/scenes/{scene.id}/visual-effects',
            headers=headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]['name'] == 'Test Effect'

def test_create_visual_effect(setup_test_environment):
    """Test creating a visual effect."""
    env = setup_test_environment
    app = env['app']
    client = env['client']
    headers = env['headers']
    scene = env['scene']

    with app.app_context():
        # Ensure scene is attached to session
        scene = db.session.merge(scene)
        db.session.flush()

        data = {
            'name': 'New Effect',
            'effect_type': 'fade',
            'parameters': {'duration': 2.0}
        }
        response = client.post(
            f'/api/scenes/{scene.id}/visual-effects',
            json=data,
            headers=headers
        )
        assert response.status_code == 201
        result = response.get_json()
        assert result['name'] == 'New Effect'
        assert result['effect_type'] == 'fade'

def test_update_visual_effect(setup_test_environment):
    """Test updating a visual effect."""
    env = setup_test_environment
    app = env['app']
    client = env['client']
    headers = env['headers']
    scene = env['scene']
    effect = env['visual_effect']

    with app.app_context():
        # Ensure objects are attached to session
        scene = db.session.merge(scene)
        effect = db.session.merge(effect)

        data = {
            'name': 'Updated Effect',
            'parameters': {'duration': 3.0}
        }
        response = client.put(
            f'/api/scenes/{scene.id}/visual-effects/{effect.id}',
            json=data,
            headers=headers
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result['name'] == 'Updated Effect'
        assert result['parameters']['duration'] == 3.0

def test_delete_visual_effect(setup_test_environment):
    """Test deleting a visual effect."""
    env = setup_test_environment
    app = env['app']
    client = env['client']
    headers = env['headers']
    scene = env['scene']
    effect = env['visual_effect']

    with app.app_context():
        # Ensure objects are attached to session
        scene = db.session.merge(scene)
        effect = db.session.merge(effect)

        response = client.delete(
            f'/api/scenes/{scene.id}/visual-effects/{effect.id}',
            headers=headers
        )
        assert response.status_code == 204

def test_get_audio_tracks(setup_test_environment):
    """Test getting audio tracks."""
    env = setup_test_environment
    app = env['app']
    client = env['client']
    headers = env['headers']
    scene = env['scene']

    with app.app_context():
        # Ensure scene is attached to session
        scene = db.session.merge(scene)

        response = client.get(
            f'/api/scenes/{scene.id}/audio-tracks',
            headers=headers
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]['name'] == 'Test Track'

def test_create_audio_track(setup_test_environment):
    """Test creating an audio track."""
    env = setup_test_environment
    app = env['app']
    client = env['client']
    headers = env['headers']
    scene = env['scene']

    with app.app_context():
        # Ensure scene is attached to session
        scene = db.session.merge(scene)

        data = {
            'name': 'New Track',
            'track_type': 'music',
            'parameters': {'volume': 0.7}
        }
        response = client.post(
            f'/api/scenes/{scene.id}/audio-tracks',
            json=data,
            headers=headers
        )
        assert response.status_code == 201
        result = response.get_json()
        assert result['name'] == 'New Track'
        assert result['track_type'] == 'music'

def test_update_audio_track(setup_test_environment):
    """Test updating an audio track."""
    env = setup_test_environment
    app = env['app']
    client = env['client']
    headers = env['headers']
    scene = env['scene']
    track = env['audio_track']

    with app.app_context():
        # Ensure objects are attached to session
        scene = db.session.merge(scene)
        track = db.session.merge(track)

        data = {
            'name': 'Updated Track',
            'parameters': {'volume': 0.9}
        }
        response = client.put(
            f'/api/scenes/{scene.id}/audio-tracks/{track.id}',
            json=data,
            headers=headers
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result['name'] == 'Updated Track'
        assert result['parameters']['volume'] == 0.9

def test_delete_audio_track(setup_test_environment):
    """Test deleting an audio track."""
    env = setup_test_environment
    app = env['app']
    client = env['client']
    headers = env['headers']
    scene = env['scene']
    track = env['audio_track']

    with app.app_context():
        # Ensure objects are attached to session
        scene = db.session.merge(scene)
        track = db.session.merge(track)

        response = client.delete(
            f'/api/scenes/{scene.id}/audio-tracks/{track.id}',
            headers=headers
        )
        assert response.status_code == 204

def test_unauthorized_access(setup_test_environment):
    """Test unauthorized access to media effects."""
    env = setup_test_environment
    app = env['app']
    client = env['client']
    scene = env['scene']

    with app.app_context():
        # Ensure scene is attached to session
        scene = db.session.merge(scene)

        # Test without auth headers
        response = client.get(f'/api/scenes/{scene.id}/visual-effects')
        assert response.status_code == 401

        response = client.get(f'/api/scenes/{scene.id}/audio-tracks')
        assert response.status_code == 401

def test_visual_effect_validation(setup_test_environment):
    """Test validation for visual effects."""
    env = setup_test_environment
    app = env['app']
    client = env['client']
    headers = env['headers']
    scene = env['scene']

    with app.app_context():
        # Ensure scene is attached to session
        scene = db.session.merge(scene)

        # Test invalid effect type
        data = {
            'name': 'Invalid Effect',
            'effect_type': 'invalid',
            'parameters': {'duration': 1.0}
        }
        response = client.post(
            f'/api/scenes/{scene.id}/visual-effects',
            json=data,
            headers=headers
        )
        assert response.status_code == 400

def test_audio_track_validation(setup_test_environment):
    """Test validation for audio tracks."""
    env = setup_test_environment
    app = env['app']
    client = env['client']
    headers = env['headers']
    scene = env['scene']

    with app.app_context():
        # Ensure scene is attached to session
        scene = db.session.merge(scene)

        # Test invalid track type
        data = {
            'name': 'Invalid Track',
            'track_type': 'invalid',
            'parameters': {'volume': 0.8}
        }
        response = client.post(
            f'/api/scenes/{scene.id}/audio-tracks',
            json=data,
            headers=headers
        )
        assert response.status_code == 400
