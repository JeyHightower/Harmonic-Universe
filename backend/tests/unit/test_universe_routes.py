import json
import pytest
from app.models import Universe, User

def test_create_universe(client, session, auth_headers):
    """Test universe creation."""
    # Create a test user first
    user = User(username='testuser', email='test@example.com')
    user.set_password('testpass123')
    session.add(user)
    session.commit()

    data = {
        'name': 'Test Universe',
        'description': 'A test universe',
        'gravity_constant': 9.81,
        'environment_harmony': 0.75
    }
    response = client.post('/api/universes',
                          data=json.dumps(data),
                          headers=auth_headers,
                          content_type='application/json')
    assert response.status_code == 201

    response_data = json.loads(response.data)
    assert response_data['name'] == 'Test Universe'
    assert response_data['gravity_constant'] == 9.81

def test_get_universes(client, session, auth_headers):
    """Test getting all universes for a user."""
    # Create a test user
    user = User(username='testuser', email='test@example.com')
    user.set_password('testpass123')
    session.add(user)
    session.commit()

    # Create some test universes
    universe1 = Universe(
        name='Universe 1',
        description='First test universe',
        gravity_constant=9.81,
        environment_harmony=0.75,
        created_by=user.id
    )
    universe2 = Universe(
        name='Universe 2',
        description='Second test universe',
        gravity_constant=10.0,
        environment_harmony=0.8,
        created_by=user.id
    )
    session.add(universe1)
    session.add(universe2)
    session.commit()

    response = client.get('/api/universes',
                         headers=auth_headers)
    assert response.status_code == 200

    response_data = json.loads(response.data)
    assert len(response_data) == 2
    assert response_data[0]['name'] == 'Universe 1'
    assert response_data[1]['name'] == 'Universe 2'

def test_get_universe(client, session, auth_headers):
    """Test getting a specific universe."""
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

    response = client.get(f'/api/universes/{universe.id}',
                         headers=auth_headers)
    assert response.status_code == 200

    response_data = json.loads(response.data)
    assert response_data['name'] == 'Test Universe'
    assert response_data['gravity_constant'] == 9.81

def test_update_universe(client, session, auth_headers):
    """Test updating a universe."""
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
        'name': 'Updated Universe',
        'gravity_constant': 10.0
    }
    response = client.put(f'/api/universes/{universe.id}',
                         data=json.dumps(data),
                         headers=auth_headers,
                         content_type='application/json')
    assert response.status_code == 200

    response_data = json.loads(response.data)
    assert response_data['name'] == 'Updated Universe'
    assert response_data['gravity_constant'] == 10.0

def test_delete_universe(client, session, auth_headers):
    """Test deleting a universe."""
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

    response = client.delete(f'/api/universes/{universe.id}',
                           headers=auth_headers)
    assert response.status_code == 200

    # Verify universe is deleted
    universe = session.query(Universe).get(universe.id)
    assert universe is None
