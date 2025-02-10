"""Test suite for scene management functionality."""
import pytest
from app.models import Scene, PhysicsObject, VisualEffect, AudioTrack
from .factories import (
    StoryboardFactory, SceneFactory,
    PhysicsObjectFactory, VisualEffectFactory, AudioTrackFactory
)

def test_scene_creation(client, storyboard, auth_headers):
    """Test scene creation endpoint."""
    response = client.post(f'/api/storyboards/{storyboard.id}/scenes',
        json={
            'name': 'New Scene',
            'description': 'A test scene',
            'sequence': 1,
            'content': {'background': 'space.jpg'},
            'physics_settings': {
                'gravity': {'x': 0, 'y': -9.81},
                'time_step': 1/60,
                'velocity_iterations': 8,
                'position_iterations': 3,
                'enabled': True
            }
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json['name'] == 'New Scene'
    assert response.json['storyboard_id'] == storyboard.id

    scene = Scene.query.get(response.json['id'])
    assert scene is not None
    assert scene.name == 'New Scene'
    assert scene.physics_settings['gravity']['y'] == -9.81

def test_scene_update(client, scene, auth_headers):
    """Test scene update endpoint."""
    response = client.put(f'/api/scenes/{scene.id}',
        json={
            'name': 'Updated Scene',
            'description': 'Updated description',
            'content': {'background': 'new_bg.jpg'},
            'physics_settings': {
                'gravity': {'x': 0, 'y': -5.0},
                'enabled': False
            }
        },
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json['name'] == 'Updated Scene'

    scene.refresh_from_db()
    assert scene.name == 'Updated Scene'
    assert scene.physics_settings['gravity']['y'] == -5.0
    assert not scene.physics_settings['enabled']

def test_scene_delete(client, scene, auth_headers):
    """Test scene deletion endpoint."""
    response = client.delete(f'/api/scenes/{scene.id}', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['message'] == 'Scene deleted successfully'

    assert Scene.query.get(scene.id) is None

def test_scene_list(client, storyboard, scene, auth_headers):
    """Test scene listing endpoint."""
    response = client.get(f'/api/storyboards/{storyboard.id}/scenes', headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json['scenes'], list)
    assert len(response.json['scenes']) > 0
    assert any(s['id'] == scene.id for s in response.json['scenes'])

def test_scene_detail(client, scene, auth_headers):
    """Test scene detail endpoint."""
    response = client.get(f'/api/scenes/{scene.id}', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['id'] == scene.id
    assert response.json['name'] == scene.name
    assert response.json['description'] == scene.description

def test_scene_physics_objects(client, scene, auth_headers):
    """Test physics objects management in scene."""
    # Create physics object
    response = client.post(f'/api/scenes/{scene.id}/physics-objects',
        json={
            'name': 'Test Object',
            'object_type': 'circle',
            'position': {'x': 100, 'y': 100},
            'dimensions': {'radius': 25},
            'mass': 1.0,
            'is_static': False
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json['name'] == 'Test Object'

    # Get physics objects
    response = client.get(f'/api/scenes/{scene.id}/physics-objects', headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json['physics_objects']) > 0

def test_scene_visual_effects(client, scene, auth_headers):
    """Test visual effects management in scene."""
    # Create visual effect
    response = client.post(f'/api/scenes/{scene.id}/visual-effects',
        json={
            'name': 'Fade Effect',
            'effect_type': 'fade',
            'parameters': {
                'duration': 1.0,
                'start_opacity': 0,
                'end_opacity': 1
            }
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json['name'] == 'Fade Effect'

    # Get visual effects
    response = client.get(f'/api/scenes/{scene.id}/visual-effects', headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json['visual_effects']) > 0

def test_scene_audio_tracks(client, scene, auth_headers):
    """Test audio tracks management in scene."""
    # Create audio track
    response = client.post(f'/api/scenes/{scene.id}/audio-tracks',
        json={
            'name': 'Background Music',
            'track_type': 'background',
            'parameters': {
                'volume': 0.8,
                'loop': True,
                'start_time': 0
            }
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json['name'] == 'Background Music'

    # Get audio tracks
    response = client.get(f'/api/scenes/{scene.id}/audio-tracks', headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json['audio_tracks']) > 0

def test_scene_physics_simulation(client, scene, auth_headers):
    """Test physics simulation endpoints."""
    # Create physics objects for simulation
    obj1 = PhysicsObjectFactory(
        scene=scene,
        position={'x': 0, 'y': 100},
        velocity={'x': 1, 'y': 0}
    )
    obj2 = PhysicsObjectFactory(
        scene=scene,
        position={'x': 100, 'y': 100},
        is_static=True
    )

    # Start simulation
    response = client.post(f'/api/scenes/{scene.id}/physics/start', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['status'] == 'started'

    # Get simulation state
    response = client.get(f'/api/scenes/{scene.id}/physics/state', headers=auth_headers)
    assert response.status_code == 200
    assert 'objects' in response.json
    assert len(response.json['objects']) == 2

def test_scene_timeline(client, scene, auth_headers):
    """Test scene timeline management."""
    timeline_data = {
        'duration': 10.0,
        'keyframes': [
            {'time': 0, 'type': 'physics', 'data': {'gravity': {'x': 0, 'y': -9.81}}},
            {'time': 5, 'type': 'visual', 'data': {'effect': 'fade', 'opacity': 0.5}},
            {'time': 8, 'type': 'audio', 'data': {'volume': 0.5}}
        ]
    }

    response = client.put(f'/api/scenes/{scene.id}/timeline',
        json=timeline_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json['duration'] == 10.0
    assert len(response.json['keyframes']) == 3

def test_scene_export(client, scene, auth_headers):
    """Test scene export functionality."""
    response = client.get(f'/api/scenes/{scene.id}/export', headers=auth_headers)
    assert response.status_code == 200
    assert 'scene_data' in response.json
    assert response.json['scene_data']['id'] == scene.id
    assert 'physics_objects' in response.json['scene_data']
    assert 'visual_effects' in response.json['scene_data']
    assert 'audio_tracks' in response.json['scene_data']

def test_scene_import(client, storyboard, auth_headers):
    """Test scene import functionality."""
    scene_data = {
        'name': 'Imported Scene',
        'description': 'Imported from template',
        'sequence': 1,
        'content': {'background': 'template_bg.jpg'},
        'physics_settings': {'enabled': True},
        'physics_objects': [],
        'visual_effects': [],
        'audio_tracks': []
    }

    response = client.post(f'/api/storyboards/{storyboard.id}/scenes/import',
        json={'scene_data': scene_data},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json['name'] == 'Imported Scene'
    assert response.json['storyboard_id'] == storyboard.id

def test_scene_preview(client, scene, auth_headers):
    """Test scene preview generation."""
    response = client.get(f'/api/scenes/{scene.id}/preview', headers=auth_headers)
    assert response.status_code == 200
    assert 'preview_data' in response.json
    assert 'thumbnail_url' in response.json
