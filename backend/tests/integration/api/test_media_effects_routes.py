"""Tests for media effects API routes."""
import json
import pytest
from backend.app.models import VisualEffect, AudioTrack
from tests.factories import VisualEffectFactory, AudioTrackFactory, SceneFactory

def test_get_visual_effects(client, scene, auth_headers):
    """Test getting all visual effects for a scene."""
    # Create some test effects
    effects = [VisualEffectFactory(scene=scene) for _ in range(3)]

    # Create an effect in another scene (shouldn't be returned)
    other_scene = SceneFactory(storyboard=scene.storyboard)
    VisualEffectFactory(scene=other_scene)

    response = client.get(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/visual-effects',
        headers=auth_headers
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert len(data['visual_effects']) == 3
    assert all(e['scene_id'] == scene.id for e in data['visual_effects'])

def test_get_audio_tracks(client, scene, auth_headers):
    """Test getting all audio tracks for a scene."""
    # Create some test tracks
    tracks = [AudioTrackFactory(scene=scene) for _ in range(3)]

    # Create a track in another scene (shouldn't be returned)
    other_scene = SceneFactory(storyboard=scene.storyboard)
    AudioTrackFactory(scene=other_scene)

    response = client.get(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/audio-tracks',
        headers=auth_headers
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert len(data['audio_tracks']) == 3
    assert all(t['scene_id'] == scene.id for t in data['audio_tracks'])

def test_get_visual_effect(client, visual_effect, auth_headers):
    """Test getting a specific visual effect."""
    scene = visual_effect.scene
    response = client.get(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/visual-effects/{visual_effect.id}',
        headers=auth_headers
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['id'] == visual_effect.id
    assert data['name'] == visual_effect.name
    assert data['effect_type'] == visual_effect.effect_type
    assert data['parameters'] == visual_effect.parameters

def test_get_audio_track(client, audio_track, auth_headers):
    """Test getting a specific audio track."""
    scene = audio_track.scene
    response = client.get(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/audio-tracks/{audio_track.id}',
        headers=auth_headers
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['id'] == audio_track.id
    assert data['name'] == audio_track.name
    assert data['track_type'] == audio_track.track_type
    assert data['file_path'] == audio_track.file_path
    assert data['parameters'] == audio_track.parameters

def test_create_visual_effect(client, scene, auth_headers):
    """Test creating a new visual effect."""
    data = {
        'name': 'New Effect',
        'effect_type': 'particle',
        'parameters': {'speed': 1.0, 'size': 2.0}
    }

    response = client.post(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/visual-effects',
        data=json.dumps(data),
        content_type='application/json',
        headers=auth_headers
    )
    assert response.status_code == 201

    data = json.loads(response.data)
    assert data['name'] == 'New Effect'
    assert data['effect_type'] == 'particle'
    assert data['parameters'] == {'speed': 1.0, 'size': 2.0}
    assert data['scene_id'] == scene.id

def test_create_audio_track(client, scene, auth_headers):
    """Test creating a new audio track."""
    data = {
        'name': 'New Track',
        'track_type': 'background',
        'file_path': 'audio/test.mp3',
        'parameters': {'volume': 0.8, 'loop': True}
    }

    response = client.post(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/audio-tracks',
        data=json.dumps(data),
        content_type='application/json',
        headers=auth_headers
    )
    assert response.status_code == 201

    data = json.loads(response.data)
    assert data['name'] == 'New Track'
    assert data['track_type'] == 'background'
    assert data['file_path'] == 'audio/test.mp3'
    assert data['parameters'] == {'volume': 0.8, 'loop': True}
    assert data['scene_id'] == scene.id

def test_update_visual_effect(client, visual_effect, auth_headers):
    """Test updating a visual effect."""
    scene = visual_effect.scene
    data = {
        'name': 'Updated Effect',
        'parameters': {'speed': 2.0, 'size': 3.0}
    }

    response = client.put(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/visual-effects/{visual_effect.id}',
        data=json.dumps(data),
        content_type='application/json',
        headers=auth_headers
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['name'] == 'Updated Effect'
    assert data['parameters'] == {'speed': 2.0, 'size': 3.0}

def test_update_audio_track(client, audio_track, auth_headers):
    """Test updating an audio track."""
    scene = audio_track.scene
    data = {
        'name': 'Updated Track',
        'parameters': {'volume': 0.5, 'loop': False}
    }

    response = client.put(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/audio-tracks/{audio_track.id}',
        data=json.dumps(data),
        content_type='application/json',
        headers=auth_headers
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert data['name'] == 'Updated Track'
    assert data['parameters'] == {'volume': 0.5, 'loop': False}

def test_delete_visual_effect(client, visual_effect, auth_headers, session):
    """Test deleting a visual effect."""
    scene = visual_effect.scene
    effect_id = visual_effect.id

    response = client.delete(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/visual-effects/{visual_effect.id}',
        headers=auth_headers
    )
    assert response.status_code == 204

    # Verify effect is deleted
    assert VisualEffect.query.get(effect_id) is None

def test_delete_audio_track(client, audio_track, auth_headers, session):
    """Test deleting an audio track."""
    scene = audio_track.scene
    track_id = audio_track.id

    response = client.delete(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/audio-tracks/{audio_track.id}',
        headers=auth_headers
    )
    assert response.status_code == 204

    # Verify track is deleted
    assert AudioTrack.query.get(track_id) is None

def test_media_effects_validation(client, scene, auth_headers):
    """Test media effects validation."""
    # Test invalid visual effect type
    data = {
        'name': 'Invalid Effect',
        'effect_type': 'invalid_type',
        'parameters': {}
    }
    response = client.post(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/visual-effects',
        data=json.dumps(data),
        content_type='application/json',
        headers=auth_headers
    )
    assert response.status_code == 400

    # Test invalid audio track type
    data = {
        'name': 'Invalid Track',
        'track_type': 'invalid_type',
        'file_path': 'test.mp3',
        'parameters': {}
    }
    response = client.post(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/audio-tracks',
        data=json.dumps(data),
        content_type='application/json',
        headers=auth_headers
    )
    assert response.status_code == 400

def test_unauthorized_access(client, scene, visual_effect, audio_track):
    """Test unauthorized access to media effects endpoints."""
    # Try without auth headers
    response = client.get(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/visual-effects'
    )
    assert response.status_code == 401

    response = client.get(
        f'/api/universes/{scene.storyboard.universe.id}/storyboards/{scene.storyboard.id}/scenes/{scene.id}/audio-tracks'
    )
    assert response.status_code == 401
