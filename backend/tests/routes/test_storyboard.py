import json
import pytest
from app.models import db, Storyboard, Scene, VisualEffect, AudioTrack

def test_get_storyboards(client, auth, universe):
    auth.login()
    response = client.get(f'/api/universes/{universe.id}/storyboards')
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_create_storyboard(client, auth, universe):
    auth.login()
    data = {
        'title': 'Test Storyboard',
        'description': 'Test Description',
        'metadata': {'key': 'value'}
    }
    response = client.post(
        f'/api/universes/{universe.id}/storyboards',
        json=data
    )
    assert response.status_code == 201
    assert response.json['title'] == data['title']
    assert response.json['description'] == data['description']
    assert response.json['metadata'] == data['metadata']

def test_get_storyboard(client, auth, storyboard):
    auth.login()
    response = client.get(f'/api/storyboards/{storyboard.id}')
    assert response.status_code == 200
    assert response.json['title'] == storyboard.title

def test_update_storyboard(client, auth, storyboard):
    auth.login()
    data = {
        'title': 'Updated Title',
        'description': 'Updated Description'
    }
    response = client.put(
        f'/api/storyboards/{storyboard.id}',
        json=data
    )
    assert response.status_code == 200
    assert response.json['title'] == data['title']
    assert response.json['description'] == data['description']

def test_delete_storyboard(client, auth, storyboard):
    auth.login()
    response = client.delete(f'/api/storyboards/{storyboard.id}')
    assert response.status_code == 204
    assert Storyboard.query.get(storyboard.id) is None

def test_get_scenes(client, auth, storyboard, scene):
    auth.login()
    response = client.get(f'/api/storyboards/{storyboard.id}/scenes')
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 1
    assert response.json[0]['title'] == scene.title

def test_create_scene(client, auth, storyboard):
    auth.login()
    data = {
        'title': 'Test Scene',
        'sequence': 1,
        'content': {'duration': 60}
    }
    response = client.post(
        f'/api/storyboards/{storyboard.id}/scenes',
        json=data
    )
    assert response.status_code == 201
    assert response.json['title'] == data['title']
    assert response.json['sequence'] == data['sequence']
    assert response.json['content'] == data['content']

def test_update_scene(client, auth, scene):
    auth.login()
    data = {
        'title': 'Updated Scene',
        'sequence': 2
    }
    response = client.put(
        f'/api/scenes/{scene.id}',
        json=data
    )
    assert response.status_code == 200
    assert response.json['title'] == data['title']
    assert response.json['sequence'] == data['sequence']

def test_delete_scene(client, auth, scene):
    auth.login()
    response = client.delete(f'/api/scenes/{scene.id}')
    assert response.status_code == 204
    assert Scene.query.get(scene.id) is None

def test_get_visual_effects(client, auth, scene, visual_effect):
    auth.login()
    response = client.get(f'/api/scenes/{scene.id}/visual-effects')
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 1
    assert response.json[0]['effect_type'] == visual_effect.effect_type

def test_create_visual_effect(client, auth, scene):
    auth.login()
    data = {
        'effect_type': 'fade',
        'parameters': {'opacity': 0.5},
        'start_time': 0,
        'duration': 5
    }
    response = client.post(
        f'/api/scenes/{scene.id}/visual-effects',
        json=data
    )
    assert response.status_code == 201
    assert response.json['effect_type'] == data['effect_type']
    assert response.json['parameters'] == data['parameters']
    assert response.json['start_time'] == data['start_time']
    assert response.json['duration'] == data['duration']

def test_get_audio_tracks(client, auth, scene, audio_track):
    auth.login()
    response = client.get(f'/api/scenes/{scene.id}/audio-tracks')
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 1
    assert response.json[0]['track_type'] == audio_track.track_type

def test_create_audio_track(client, auth, scene):
    auth.login()
    data = {
        'track_type': 'background',
        'parameters': {'volume': 0.8},
        'start_time': 0,
        'duration': 10
    }
    response = client.post(
        f'/api/scenes/{scene.id}/audio-tracks',
        json=data
    )
    assert response.status_code == 201
    assert response.json['track_type'] == data['track_type']
    assert response.json['parameters'] == data['parameters']
    assert response.json['start_time'] == data['start_time']
    assert response.json['duration'] == data['duration']

@pytest.fixture
def storyboard(universe):
    storyboard = Storyboard(
        universe_id=universe.id,
        title='Test Storyboard',
        description='Test Description'
    )
    db.session.add(storyboard)
    db.session.commit()
    return storyboard

@pytest.fixture
def scene(storyboard):
    scene = Scene(
        storyboard_id=storyboard.id,
        title='Test Scene',
        sequence=1,
        content={'duration': 60}
    )
    db.session.add(scene)
    db.session.commit()
    return scene

@pytest.fixture
def visual_effect(scene):
    effect = VisualEffect(
        scene_id=scene.id,
        effect_type='fade',
        parameters={'opacity': 0.5},
        start_time=0,
        duration=5
    )
    db.session.add(effect)
    db.session.commit()
    return effect

@pytest.fixture
def audio_track(scene):
    track = AudioTrack(
        scene_id=scene.id,
        track_type='background',
        parameters={'volume': 0.8},
        start_time=0,
        duration=10
    )
    db.session.add(track)
    db.session.commit()
    return track
