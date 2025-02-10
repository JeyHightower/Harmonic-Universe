"""Test suite for storyboard management functionality."""
import pytest
from app.models import Storyboard, Scene
from .factories import UniverseFactory, StoryboardFactory, SceneFactory

def test_storyboard_creation(client, universe, auth_headers):
    """Test storyboard creation endpoint."""
    response = client.post(f'/api/universes/{universe.id}/storyboards',
        json={
            'name': 'New Storyboard',
            'description': 'A test storyboard',
            'settings': {
                'layout': 'grid',
                'theme': 'dark'
            }
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json['name'] == 'New Storyboard'
    assert response.json['universe_id'] == universe.id

    storyboard = Storyboard.query.get(response.json['id'])
    assert storyboard is not None
    assert storyboard.name == 'New Storyboard'

def test_storyboard_update(client, storyboard, auth_headers):
    """Test storyboard update endpoint."""
    response = client.put(f'/api/storyboards/{storyboard.id}',
        json={
            'name': 'Updated Storyboard',
            'description': 'Updated description',
            'settings': {
                'layout': 'list',
                'theme': 'light'
            }
        },
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json['name'] == 'Updated Storyboard'

    storyboard.refresh_from_db()
    assert storyboard.name == 'Updated Storyboard'
    assert storyboard.settings['layout'] == 'list'

def test_storyboard_delete(client, storyboard, auth_headers):
    """Test storyboard deletion endpoint."""
    response = client.delete(f'/api/storyboards/{storyboard.id}', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['message'] == 'Storyboard deleted successfully'

    assert Storyboard.query.get(storyboard.id) is None

def test_storyboard_list(client, universe, storyboard, auth_headers):
    """Test storyboard listing endpoint."""
    response = client.get(f'/api/universes/{universe.id}/storyboards', headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json['storyboards'], list)
    assert len(response.json['storyboards']) > 0
    assert any(s['id'] == storyboard.id for s in response.json['storyboards'])

def test_storyboard_detail(client, storyboard, auth_headers):
    """Test storyboard detail endpoint."""
    response = client.get(f'/api/storyboards/{storyboard.id}', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['id'] == storyboard.id
    assert response.json['name'] == storyboard.name
    assert response.json['description'] == storyboard.description

def test_storyboard_scene_ordering(client, storyboard, auth_headers):
    """Test scene ordering within storyboard."""
    # Create multiple scenes
    scenes = [
        SceneFactory(storyboard=storyboard, sequence=i)
        for i in range(3)
    ]

    # Reorder scenes
    new_order = [scenes[2].id, scenes[0].id, scenes[1].id]
    response = client.put(f'/api/storyboards/{storyboard.id}/scene-order',
        json={'scene_order': new_order},
        headers=auth_headers
    )
    assert response.status_code == 200

    # Verify new order
    updated_scenes = Scene.query.filter_by(storyboard_id=storyboard.id).order_by(Scene.sequence).all()
    assert [scene.id for scene in updated_scenes] == new_order

def test_storyboard_duplicate(client, storyboard, auth_headers):
    """Test storyboard duplication."""
    response = client.post(f'/api/storyboards/{storyboard.id}/duplicate', headers=auth_headers)
    assert response.status_code == 201
    assert response.json['name'].startswith('Copy of')
    assert response.json['universe_id'] == storyboard.universe_id

    # Verify scenes were duplicated
    original_scene_count = Scene.query.filter_by(storyboard_id=storyboard.id).count()
    new_scene_count = Scene.query.filter_by(storyboard_id=response.json['id']).count()
    assert new_scene_count == original_scene_count

def test_storyboard_export(client, storyboard, auth_headers):
    """Test storyboard export functionality."""
    response = client.get(f'/api/storyboards/{storyboard.id}/export', headers=auth_headers)
    assert response.status_code == 200
    assert 'storyboard_data' in response.json
    assert response.json['storyboard_data']['id'] == storyboard.id
    assert 'scenes' in response.json['storyboard_data']

def test_storyboard_import(client, universe, auth_headers):
    """Test storyboard import functionality."""
    storyboard_data = {
        'name': 'Imported Storyboard',
        'description': 'Imported from template',
        'settings': {'layout': 'grid'},
        'scenes': []
    }

    response = client.post(f'/api/universes/{universe.id}/storyboards/import',
        json={'storyboard_data': storyboard_data},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json['name'] == 'Imported Storyboard'
    assert response.json['universe_id'] == universe.id

def test_storyboard_search(client, universe, auth_headers):
    """Test storyboard search functionality."""
    response = client.get(f'/api/universes/{universe.id}/storyboards/search?q=test',
        headers=auth_headers
    )
    assert response.status_code == 200
    assert isinstance(response.json['results'], list)

def test_storyboard_statistics(client, storyboard, auth_headers):
    """Test storyboard statistics endpoint."""
    response = client.get(f'/api/storyboards/{storyboard.id}/stats', headers=auth_headers)
    assert response.status_code == 200
    assert 'scene_count' in response.json
    assert 'total_duration' in response.json
    assert 'last_modified' in response.json

def test_storyboard_preview(client, storyboard, auth_headers):
    """Test storyboard preview generation."""
    response = client.get(f'/api/storyboards/{storyboard.id}/preview', headers=auth_headers)
    assert response.status_code == 200
    assert 'preview_data' in response.json
    assert 'thumbnail_url' in response.json

def test_storyboard_sharing(client, storyboard, auth_headers):
    """Test storyboard sharing functionality."""
    share_settings = {
        'is_public': True,
        'allow_comments': True,
        'allow_duplicates': True
    }

    response = client.post(f'/api/storyboards/{storyboard.id}/share',
        json=share_settings,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json['share_url'] is not None
    assert response.json['settings'] == share_settings
