import json
import pytest
from app.models import User, Universe, Storyboard, Version

def test_create_storyboard(client, session, auth_headers):
    """Test storyboard creation."""
    # Create test user and universe
    user = User(email='test@example.com', password='testpass123')
    session.add(user)
    session.commit()

    universe = Universe(
        title='Test Universe',
        description='A test universe',
        is_public=True,
        user_id=user.id
    )
    session.add(universe)
    session.commit()

    data = {
        'plot_point': 'Test Plot Point',
        'description': 'A test plot point',
        'harmony_tie': 0.7,
        'content': 'Initial content'
    }

    response = client.post(f'/api/storyboards/{universe.id}',
                          json=data,
                          headers=auth_headers)
    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert response_data['status'] == 'success'
    assert response_data['data']['storyboard']['plot_point'] == 'Test Plot Point'

def test_get_storyboards(client, session, auth_headers):
    """Test getting storyboards for a universe."""
    # Create test user and universe
    user = User(email='test@example.com', password='testpass123')
    session.add(user)
    session.commit()

    universe = Universe(
        title='Test Universe',
        description='A test universe',
        is_public=True,
        user_id=user.id
    )
    session.add(universe)
    session.commit()

    # Create test storyboards
    storyboard1 = Storyboard(
        plot_point='Plot Point 1',
        description='First test plot point',
        harmony_tie=0.5,
        universe_id=universe.id,
        user_id=user.id
    )
    storyboard2 = Storyboard(
        plot_point='Plot Point 2',
        description='Second test plot point',
        harmony_tie=0.7,
        universe_id=universe.id,
        user_id=user.id
    )
    session.add(storyboard1)
    session.add(storyboard2)
    session.commit()

    response = client.get(f'/api/storyboards/{universe.id}',
                         headers=auth_headers)
    assert response.status_code == 200

    response_data = json.loads(response.data)
    assert response_data['status'] == 'success'
    assert len(response_data['data']['storyboards']) == 2
    assert response_data['data']['storyboards'][0]['plot_point'] == 'Plot Point 1'
    assert response_data['data']['storyboards'][1]['plot_point'] == 'Plot Point 2'

def test_update_storyboard(client, session, auth_headers):
    """Test updating a storyboard."""
    # Create test user and universe
    user = User(email='test@example.com', password='testpass123')
    session.add(user)
    session.commit()

    universe = Universe(
        title='Test Universe',
        description='A test universe',
        is_public=True,
        user_id=user.id
    )
    session.add(universe)
    session.commit()

    # Create test storyboard
    storyboard = Storyboard(
        plot_point='Original Plot Point',
        description='Original description',
        harmony_tie=0.5,
        universe_id=universe.id,
        user_id=user.id
    )
    session.add(storyboard)
    session.commit()

    data = {
        'plot_point': 'Updated Plot Point',
        'harmony_tie': 0.8,
        'content': 'Updated content',
        'version_description': 'Update test'
    }

    response = client.put(f'/api/storyboards/{storyboard.id}',
                         json=data,
                         headers=auth_headers)
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert response_data['status'] == 'success'
    assert response_data['data']['storyboard']['plot_point'] == 'Updated Plot Point'
    assert response_data['data']['storyboard']['harmony_tie'] == 0.8

def test_delete_storyboard(client, session, auth_headers):
    """Test deleting a storyboard."""
    # Create test user and universe
    user = User(email='test@example.com', password='testpass123')
    session.add(user)
    session.commit()

    universe = Universe(
        title='Test Universe',
        description='A test universe',
        is_public=True,
        user_id=user.id
    )
    session.add(universe)
    session.commit()

    # Create test storyboard
    storyboard = Storyboard(
        plot_point='Test Plot Point',
        description='Test description',
        harmony_tie=0.5,
        universe_id=universe.id,
        user_id=user.id
    )
    session.add(storyboard)
    session.commit()

    response = client.delete(f'/api/storyboards/{storyboard.id}',
                           headers=auth_headers)
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert response_data['status'] == 'success'
    assert response_data['message'] == 'Storyboard deleted successfully'

def test_get_storyboard_versions(client, session, auth_headers):
    """Test getting version history for a storyboard."""
    # Create test user and universe
    user = User(email='test@example.com', password='testpass123')
    session.add(user)
    session.commit()

    universe = Universe(
        title='Test Universe',
        description='A test universe',
        is_public=True,
        user_id=user.id
    )
    session.add(universe)
    session.commit()

    # Create test storyboard
    storyboard = Storyboard(
        plot_point='Test Plot Point',
        description='Test description',
        harmony_tie=0.5,
        universe_id=universe.id,
        user_id=user.id
    )
    session.add(storyboard)
    session.commit()

    # Create test versions
    Version.create_version(
        storyboard_id=storyboard.id,
        content='Version 1 content',
        description='First version',
        created_by=user.id
    )
    Version.create_version(
        storyboard_id=storyboard.id,
        content='Version 2 content',
        description='Second version',
        created_by=user.id
    )

    response = client.get(f'/api/storyboards/{storyboard.id}/versions',
                         headers=auth_headers)
    assert response.status_code == 200

    response_data = json.loads(response.data)
    assert response_data['status'] == 'success'
    assert len(response_data['data']['versions']) == 2
    assert response_data['data']['versions'][0]['content'] == 'Version 2 content'  # Most recent first
    assert response_data['data']['versions'][1]['content'] == 'Version 1 content'
