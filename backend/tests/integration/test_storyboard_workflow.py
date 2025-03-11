import pytest
from app.models import Storyboard, Universe
from ..factories import UniverseFactory, StoryboardFactory

def test_storyboard_management_workflow(client, auth_headers, test_user):
    """Test the complete workflow of managing storyboards within a universe"""

    # First create a universe
    universe_data = {
        'name': 'Storyboard Test Universe',
        'description': 'A universe for testing storyboard management'
    }
    response = client.post('/api/universes', json=universe_data, headers=auth_headers)
    assert response.status_code == 201
    universe_id = response.json['id']

    # Create multiple storyboards
    storyboards_data = [
        {
            'name': f'Test Storyboard {i}',
            'description': f'Description for storyboard {i}',
            'universe_id': universe_id
        }
        for i in range(3)
    ]

    created_storyboards = []
    for storyboard_data in storyboards_data:
        response = client.post('/api/storyboards', json=storyboard_data, headers=auth_headers)
        assert response.status_code == 201
        created_storyboards.append(response.json)

    # Verify storyboards in universe
    response = client.get(f'/api/universes/{universe_id}', headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json['storyboards']) == 3

    # Update a storyboard
    storyboard_id = created_storyboards[0]['id']
    update_data = {
        'name': 'Updated Storyboard Name',
        'description': 'Updated storyboard description'
    }
    response = client.put(
        f'/api/storyboards/{storyboard_id}',
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json['name'] == update_data['name']

    # Add scenes to storyboard
    scene_ids = [1, 2, 3]  # Assuming these scenes exist
    scene_data = {
        'scene_ids': scene_ids
    }
    response = client.post(
        f'/api/storyboards/{storyboard_id}/scenes',
        json=scene_data,
        headers=auth_headers
    )
    assert response.status_code == 200

    # Verify scenes in storyboard
    response = client.get(f'/api/storyboards/{storyboard_id}', headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json['scenes']) == len(scene_ids)

    # Delete a storyboard
    response = client.delete(
        f'/api/storyboards/{storyboard_id}',
        headers=auth_headers
    )
    assert response.status_code == 204

    # Verify storyboard count
    response = client.get(f'/api/universes/{universe_id}', headers=auth_headers)
    assert len(response.json['storyboards']) == 2
