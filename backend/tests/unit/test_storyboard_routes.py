import json
import pytest
from app.models import User, Universe, Storyboard

def test_create_storyboard(client, session, auth_headers):
    """Test storyboard creation."""
    # Create test user and universe
    user = User(username='testuser', email='test@example.com')
    user.set_password('testpass123')
    session.add(user)

    universe = Universe(
        name='Test Universe',
        description='A test universe',
        gravity_constant=9.81,
        environment_harmony=0.75,
        created_by=user.id
    )
    session.add(universe)
    session.commit()

    data = {
        'plot_point': 'Test Plot Point',
        'description': 'A test plot point',
        'harmony_tie': 0.8
    }
    response = client.post(f'/api/storyboards/universe/{universe.id}',
                          data=json.dumps(data),
                          headers=auth_headers,
                          content_type='application/json')
    assert response.status_code == 201

    response_data = json.loads(response.data)
    assert response_data['plot_point'] == 'Test Plot Point'
    assert response_data['harmony_tie'] == 0.8

def test_get_storyboards(client, session, auth_headers):
    """Test getting all storyboards for a universe."""
    # Create test user and universe
    user = User(username='testuser', email='test@example.com')
    user.set_password('testpass123')
    session.add(user)

    universe = Universe(
        name='Test Universe',
        description='A test universe',
        gravity_constant=9.81,
        environment_harmony=0.75,
        created_by=user.id
    )
    session.add(universe)
    session.commit()

    # Create some test storyboards
    storyboard1 = Storyboard(
        universe_id=universe.id,
        plot_point='Plot Point 1',
        description='First test plot point',
        harmony_tie=0.8
    )
    storyboard2 = Storyboard(
        universe_id=universe.id,
        plot_point='Plot Point 2',
        description='Second test plot point',
        harmony_tie=0.6
    )
    session.add(storyboard1)
    session.add(storyboard2)
    session.commit()

    response = client.get(f'/api/storyboards/universe/{universe.id}',
                         headers=auth_headers)
    assert response.status_code == 200

    response_data = json.loads(response.data)
    assert len(response_data) == 2
    assert response_data[0]['plot_point'] == 'Plot Point 1'
    assert response_data[1]['plot_point'] == 'Plot Point 2'

def test_update_storyboard(client, session, auth_headers):
    """Test updating a storyboard."""
    # Create test user, universe, and storyboard
    user = User(username='testuser', email='test@example.com')
    user.set_password('testpass123')
    session.add(user)

    universe = Universe(
        name='Test Universe',
        description='A test universe',
        gravity_constant=9.81,
        environment_harmony=0.75,
        created_by=user.id
    )
    session.add(universe)

    storyboard = Storyboard(
        universe_id=universe.id,
        plot_point='Original Plot Point',
        description='Original description',
        harmony_tie=0.8
    )
    session.add(storyboard)
    session.commit()

    data = {
        'plot_point': 'Updated Plot Point',
        'harmony_tie': 0.9
    }
    response = client.put(f'/api/storyboards/{storyboard.id}',
                         data=json.dumps(data),
                         headers=auth_headers,
                         content_type='application/json')
    assert response.status_code == 200

    response_data = json.loads(response.data)
    assert response_data['plot_point'] == 'Updated Plot Point'
    assert response_data['harmony_tie'] == 0.9

def test_delete_storyboard(client, session, auth_headers):
    """Test deleting a storyboard."""
    # Create test user, universe, and storyboard
    user = User(username='testuser', email='test@example.com')
    user.set_password('testpass123')
    session.add(user)

    universe = Universe(
        name='Test Universe',
        description='A test universe',
        gravity_constant=9.81,
        environment_harmony=0.75,
        created_by=user.id
    )
    session.add(universe)

    storyboard = Storyboard(
        universe_id=universe.id,
        plot_point='Test Plot Point',
        description='Test description',
        harmony_tie=0.8
    )
    session.add(storyboard)
    session.commit()

    response = client.delete(f'/api/storyboards/{storyboard.id}',
                           headers=auth_headers)
    assert response.status_code == 200

    # Verify storyboard is deleted
    storyboard = session.query(Storyboard).get(storyboard.id)
    assert storyboard is None

def test_get_storyboard_versions(client, session, auth_headers):
    """Test getting version history for a storyboard."""
    # Create test user, universe, and storyboard
    user = User(username='testuser', email='test@example.com')
    user.set_password('testpass123')
    session.add(user)

    universe = Universe(
        name='Test Universe',
        description='A test universe',
        gravity_constant=9.81,
        environment_harmony=0.75,
        created_by=user.id
    )
    session.add(universe)

    storyboard = Storyboard(
        universe_id=universe.id,
        plot_point='Test Plot Point',
        description='Test description',
        harmony_tie=0.8
    )
    session.add(storyboard)
    session.commit()

    response = client.get(f'/api/storyboards/{storyboard.id}/versions',
                         headers=auth_headers)
    assert response.status_code == 200

    response_data = json.loads(response.data)
    assert isinstance(response_data, list)
