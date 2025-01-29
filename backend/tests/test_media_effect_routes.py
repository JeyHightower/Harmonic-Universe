"""Tests for media effect routes."""
import json
import pytest
from ..app.models import User, Universe, Storyboard, Scene, VisualEffect, AudioTrack

def test_get_visual_effects(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test getting all visual effects for a scene."""
    auth.login()

    # Create test visual effects
    effect1 = VisualEffect(
        scene_id=test_scene.id,
        effect_type='particle',
        parameters={'key': 'value1'},
        start_time=0.0,
        duration=5.0
    )
    effect2 = VisualEffect(
        scene_id=test_scene.id,
        effect_type='shader',
        parameters={'key': 'value2'},
        start_time=5.0,
        duration=5.0
    )
    db.session.add_all([effect1, effect2])
    db.session.commit()

    response = client.get(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/visual-effects'
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert len(data) == 2
    assert data[0]['effect_type'] == 'particle'
    assert data[1]['effect_type'] == 'shader'

def test_create_visual_effect(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test creating a new visual effect."""
    auth.login()

    effect_data = {
        'effect_type': 'particle',
        'parameters': {'key': 'value'},
        'start_time': 0.0,
        'duration': 5.0
    }

    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/visual-effects',
        json=effect_data
    )
    assert response.status_code == 201

    data = json.loads(response.data)
    assert data['effect_type'] == 'particle'
    assert data['parameters'] == {'key': 'value'}
    assert data['start_time'] == 0.0
    assert data['duration'] == 5.0

def test_update_visual_effect(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test updating a visual effect."""
    auth.login()

    effect = VisualEffect(
        scene_id=test_scene.id,
        effect_type='particle',
        parameters={'key': 'value'},
        start_time=0.0,
        duration=5.0
    )
    db.session.add(effect)
    db.session.commit()

    update_data = {
        'effect_type': 'shader',
        'parameters': {'key': 'updated'},
        'start_time': 1.0,
        'duration': 4.0
    }

    response = client.put(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/visual-effects/{effect.id}',
        json=update_data
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['effect_type'] == 'shader'
    assert data['parameters'] == {'key': 'updated'}
    assert data['start_time'] == 1.0
    assert data['duration'] == 4.0

def test_delete_visual_effect(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test deleting a visual effect."""
    auth.login()

    effect = VisualEffect(
        scene_id=test_scene.id,
        effect_type='particle',
        parameters={'key': 'value'},
        start_time=0.0,
        duration=5.0
    )
    db.session.add(effect)
    db.session.commit()

    response = client.delete(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/visual-effects/{effect.id}'
    )
    assert response.status_code == 204

    # Verify effect is deleted
    effect = VisualEffect.query.get(effect.id)
    assert effect is None

def test_get_audio_tracks(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test getting all audio tracks for a scene."""
    auth.login()

    # Create test audio tracks
    track1 = AudioTrack(
        scene_id=test_scene.id,
        track_type='music',
        parameters={'key': 'value1'},
        start_time=0.0,
        duration=5.0,
        volume=1.0
    )
    track2 = AudioTrack(
        scene_id=test_scene.id,
        track_type='effect',
        parameters={'key': 'value2'},
        start_time=5.0,
        duration=5.0,
        volume=0.8
    )
    db.session.add_all([track1, track2])
    db.session.commit()

    response = client.get(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/audio-tracks'
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert len(data) == 2
    assert data[0]['track_type'] == 'music'
    assert data[1]['track_type'] == 'effect'

def test_create_audio_track(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test creating a new audio track."""
    auth.login()

    track_data = {
        'track_type': 'music',
        'parameters': {'key': 'value'},
        'start_time': 0.0,
        'duration': 5.0,
        'volume': 0.8
    }

    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/audio-tracks',
        json=track_data
    )
    assert response.status_code == 201

    data = json.loads(response.data)
    assert data['track_type'] == 'music'
    assert data['parameters'] == {'key': 'value'}
    assert data['start_time'] == 0.0
    assert data['duration'] == 5.0
    assert data['volume'] == 0.8

def test_update_audio_track(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test updating an audio track."""
    auth.login()

    track = AudioTrack(
        scene_id=test_scene.id,
        track_type='music',
        parameters={'key': 'value'},
        start_time=0.0,
        duration=5.0,
        volume=1.0
    )
    db.session.add(track)
    db.session.commit()

    update_data = {
        'track_type': 'effect',
        'parameters': {'key': 'updated'},
        'start_time': 1.0,
        'duration': 4.0,
        'volume': 0.5
    }

    response = client.put(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/audio-tracks/{track.id}',
        json=update_data
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['track_type'] == 'effect'
    assert data['parameters'] == {'key': 'updated'}
    assert data['start_time'] == 1.0
    assert data['duration'] == 4.0
    assert data['volume'] == 0.5

def test_delete_audio_track(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test deleting an audio track."""
    auth.login()

    track = AudioTrack(
        scene_id=test_scene.id,
        track_type='music',
        parameters={'key': 'value'},
        start_time=0.0,
        duration=5.0,
        volume=1.0
    )
    db.session.add(track)
    db.session.commit()

    response = client.delete(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/audio-tracks/{track.id}'
    )
    assert response.status_code == 204

    # Verify track is deleted
    track = AudioTrack.query.get(track.id)
    assert track is None

def test_unauthorized_access(client, test_user, test_universe, test_storyboard, test_scene):
    """Test unauthorized access to media effect routes."""
    # Without login
    response = client.get(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/visual-effects'
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

    # Try to access visual effects
    response = client.get(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/visual-effects'
    )
    assert response.status_code == 403

def test_visual_effect_validation(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test visual effect data validation."""
    auth.login()

    # Test missing required fields
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/visual-effects',
        json={'effect_type': 'particle'}
    )
    assert response.status_code == 400
    assert b'Parameters is required' in response.data

    # Test invalid effect type
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/visual-effects',
        json={
            'effect_type': 'invalid',
            'parameters': {'key': 'value'},
            'start_time': 0.0,
            'duration': 5.0
        }
    )
    assert response.status_code == 400
    assert b'Effect type must be one of' in response.data

    # Test negative start time
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/visual-effects',
        json={
            'effect_type': 'particle',
            'parameters': {'key': 'value'},
            'start_time': -1.0,
            'duration': 5.0
        }
    )
    assert response.status_code == 400
    assert b'Start time cannot be negative' in response.data

    # Test non-positive duration
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/visual-effects',
        json={
            'effect_type': 'particle',
            'parameters': {'key': 'value'},
            'start_time': 0.0,
            'duration': 0.0
        }
    )
    assert response.status_code == 400
    assert b'Duration must be positive' in response.data

def test_audio_track_validation(client, auth, test_user, test_universe, test_storyboard, test_scene):
    """Test audio track data validation."""
    auth.login()

    # Test missing required fields
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/audio-tracks',
        json={'track_type': 'music'}
    )
    assert response.status_code == 400
    assert b'Parameters is required' in response.data

    # Test invalid track type
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/audio-tracks',
        json={
            'track_type': 'invalid',
            'parameters': {'key': 'value'},
            'start_time': 0.0,
            'duration': 5.0,
            'volume': 1.0
        }
    )
    assert response.status_code == 400
    assert b'Track type must be one of' in response.data

    # Test invalid volume
    response = client.post(
        f'/api/universes/{test_universe.id}/storyboards/{test_storyboard.id}/scenes/{test_scene.id}/audio-tracks',
        json={
            'track_type': 'music',
            'parameters': {'key': 'value'},
            'start_time': 0.0,
            'duration': 5.0,
            'volume': 1.5
        }
    )
    assert response.status_code == 400
    assert b'Volume must be between 0 and 1' in response.data
