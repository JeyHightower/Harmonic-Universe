import json
import pytest
from flask import url_for
from app.models import Universe, User, PhysicsParameters, MusicParameters, VisualizationParameters
from app.extensions import db
from app.schemas import UniverseSchema
from flask_jwt_extended import create_access_token
from unittest.mock import patch

def test_create_universe(client, session, auth_headers):
    """Test creating a universe with valid parameters."""
    data = {
        'name': 'Test Universe',
        'description': 'A test universe',
        'is_public': True,
        'physics_parameters': {
            'gravity': 9.81,
            'friction': 0.5,
            'elasticity': 0.7,
            'air_resistance': 0.1,
            'density': 1.0
        },
        'music_parameters': {
            'harmony': 1.0,
            'tempo': 120,
            'key': 'C',
            'scale': 'major'
        }
    }

    response = client.post('/api/universes',
                         json=data,
                         headers=auth_headers)
    assert response.status_code == 201
    assert response.json['universe']['name'] == 'Test Universe'

def test_create_universe_invalid_parameters(client, auth_headers):
    """Test creating a universe with invalid parameters."""
    # Test missing required fields
    response = client.post('/api/universes',
                         json={},
                         headers=auth_headers)
    assert response.status_code == 400
    assert response.json['status'] == 'error'
    assert response.json['message'] == 'Name is required'

    # Test invalid physics parameters
    data = {
        'name': 'Test Universe',
        'description': 'A test universe',
        'physics_parameters': {
            'gravity': -1,  # Invalid negative gravity
            'friction': 2.0  # Invalid friction > 1
        }
    }
    response = client.post('/api/universes',
                         json=data,
                         headers=auth_headers)
    assert response.status_code == 400

    # Test invalid music parameters
    data = {
        'name': 'Test Universe',
        'description': 'A test universe',
        'music_parameters': {
            'tempo': -120,  # Invalid negative tempo
            'key': 'H'  # Invalid key
        }
    }
    response = client.post('/api/universes',
                         json=data,
                         headers=auth_headers)
    assert response.status_code == 400

def test_update_physics_parameters(client, session, auth_headers):
    """Test updating physics parameters of a universe."""
    # Create a universe first
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    # Update physics parameters
    data = {
        'gravity': 5.0,
        'friction': 0.3,
        'elasticity': 0.8,
        'air_resistance': 0.2,
        'density': 1.2,
        'time_scale': 1.5
    }
    response = client.put(f'/api/universes/{universe.id}/physics',
                       json=data,
                       headers=auth_headers)
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert response_data['universe']['physics_parameters']['gravity'] == 5.0
    assert response_data['universe']['physics_parameters']['time_scale'] == 1.5

def test_update_music_parameters(client, session, auth_headers):
    """Test updating music parameters of a universe."""
    # Create a universe first
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    # Update music parameters
    data = {
        'tempo': 140,
        'key': 'G',
        'scale': 'minor',
        'rhythm_complexity': 0.7,
        'melody_range': 0.6
    }
    response = client.put(f'/api/universes/{universe.id}/music',
                       json=data,
                       headers=auth_headers)
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert response_data['universe']['music_parameters']['tempo'] == 140
    assert response_data['universe']['music_parameters']['rhythm_complexity'] == 0.7

def test_update_visualization_parameters(client, session, auth_headers):
    """Test updating visualization parameters of a universe."""
    # Create a universe first
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    # Update visualization parameters
    data = {
        'brightness': 0.9,
        'saturation': 0.8,
        'complexity': 0.7,
        'color_scheme': 'monochrome',
        'background_color': '#000000',
        'particle_color': '#FFFFFF',
        'glow_color': '#00FF00',
        'particle_count': 5000,
        'particle_size': 2.5,
        'particle_speed': 1.5,
        'glow_intensity': 0.8,
        'blur_amount': 0.3,
        'trail_length': 0.6,
        'animation_speed': 1.2,
        'bounce_factor': 0.7,
        'rotation_speed': 2.0,
        'camera_zoom': 1.5,
        'camera_rotation': 45
    }
    response = client.put(f'/api/universes/{universe.id}/visualization',
                       json=data,
                       headers=auth_headers)
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert response_data['universe']['visualization_parameters']['brightness'] == 0.9
    assert response_data['universe']['visualization_parameters']['particle_count'] == 5000
    assert response_data['universe']['visualization_parameters']['camera_zoom'] == 1.5

def test_invalid_parameters(client, session, auth_headers):
    """Test validation of invalid parameters."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    # Test invalid physics parameters
    data = {
        'gravity': -1.0,  # Invalid negative gravity
        'time_scale': 0.05  # Below minimum
    }
    response = client.put(f'/api/universes/{universe.id}/physics',
                       json=data,
                       headers=auth_headers)
    assert response.status_code == 400
    assert 'gravity' in response.json['message']
    assert 'time_scale' in response.json['message']

    # Test invalid music parameters
    data = {
        'tempo': 300,  # Above maximum
        'key': 'H',  # Invalid key
        'rhythm_complexity': 1.5  # Above maximum
    }
    response = client.put(f'/api/universes/{universe.id}/music',
                       json=data,
                       headers=auth_headers)
    assert response.status_code == 400
    assert 'tempo' in response.json['message']
    assert 'key' in response.json['message']
    assert 'rhythm_complexity' in response.json['message']

    # Test invalid visualization parameters
    data = {
        'particle_count': 50,  # Below minimum
        'camera_rotation': 400,  # Above maximum
        'color_scheme': 'invalid'  # Invalid scheme
    }
    response = client.put(f'/api/universes/{universe.id}/visualization',
                       json=data,
                       headers=auth_headers)
    assert response.status_code == 400
    assert 'particle_count' in response.json['message']
    assert 'camera_rotation' in response.json['message']
    assert 'color_scheme' in response.json['message']

def test_filter_universes_by_visibility(client, session, auth_headers):
    """Test filtering universes by visibility."""
    # Create test universes
    user = User.query.get(1)
    universes = [
        Universe(name='Public Universe 1', is_public=True, user_id=user.id),
        Universe(name='Private Universe 1', is_public=False, user_id=user.id),
        Universe(name='Public Universe 2', is_public=True, user_id=user.id)
    ]
    for universe in universes:
        session.add(universe)
    session.commit()

    # Test filtering public universes
    response = client.get('/api/universes/public',
                         headers=auth_headers)
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert len(response_data['universes']) == 2

    # Test filtering private universes
    response = client.get('/api/universes/private',
                         headers=auth_headers)
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert len(response_data['universes']) == 1

def test_search_universes_by_title(client, session, auth_headers):
    """Test searching universes by title."""
    # Create test universes
    user = User.query.get(1)
    universes = [
        Universe(name='Harmonic Universe', is_public=True, user_id=user.id),
        Universe(name='Cosmic Symphony', is_public=True, user_id=user.id),
        Universe(name='Musical Galaxy', is_public=True, user_id=user.id)
    ]
    for universe in universes:
        session.add(universe)
    session.commit()

    # Test search with matching query
    response = client.get('/api/universes/search?q=harmonic',
                         headers=auth_headers)
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert len(response_data['universes']) == 1
    assert response_data['universes'][0]['name'] == 'Harmonic Universe'

    # Test search with partial match
    response = client.get('/api/universes/search?q=universe',
                         headers=auth_headers)
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert len(response_data['universes']) == 1

    # Test search with no matches
    response = client.get('/api/universes/search?q=nonexistent',
                         headers=auth_headers)
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert len(response_data['universes']) == 0

def test_get_universes(client, session, auth_headers):
    """Test getting all universes for a user."""
    # Create a test user
    user = User(email='test@example.com', username='testuser')
    user.set_password('testpass123')
    session.add(user)
    session.commit()

    # Create some test universes
    universe1 = Universe(
        name='Universe 1',
        description='First test universe',
        is_public=True,
        user_id=user.id
    )
    universe2 = Universe(
        name='Universe 2',
        description='Second test universe',
        is_public=True,
        user_id=user.id
    )
    session.add(universe1)
    session.add(universe2)
    session.commit()

    response = client.get('/api/universes',
                         headers=auth_headers)
    assert response.status_code == 200

    response_data = json.loads(response.data)
    assert response_data['status'] == 'success'
    assert len(response_data['data']['universes']) == 2
    assert response_data['data']['universes'][0]['name'] == 'Universe 1'
    assert response_data['data']['universes'][1]['name'] == 'Universe 2'

def test_get_universe(client, session, auth_headers):
    """Test getting a specific universe."""
    # Create test user and universe
    user = User(email='test@example.com', username='testuser')
    user.set_password('testpass123')
    session.add(user)
    session.commit()

    universe = Universe(
        name='Test Universe',
        description='A test universe',
        is_public=True,
        user_id=user.id
    )
    session.add(universe)
    session.commit()

    response = client.get(f'/api/universes/{universe.id}',
                         headers=auth_headers)
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert response_data['status'] == 'success'
    assert response_data['data']['universe']['name'] == 'Test Universe'

def test_update_universe(client, session, auth_headers):
    """Test updating a universe."""
    # Create test user and universe
    user = User(email='test@example.com', username='testuser')
    user.set_password('testpass123')
    session.add(user)
    session.commit()

    universe = Universe(
        name='Test Universe',
        description='A test universe',
        is_public=True,
        user_id=user.id
    )
    session.add(universe)
    session.commit()

    data = {
        'name': 'Updated Universe',
        'is_public': False
    }
    response = client.put(f'/api/universes/{universe.id}',
                         json=data,
                         headers=auth_headers)
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert response_data['status'] == 'success'
    assert response_data['data']['universe']['name'] == 'Updated Universe'
    assert not response_data['data']['universe']['is_public']

def test_delete_universe(client, session, auth_headers):
    """Test deleting a universe."""
    # Create test user and universe
    user = User(email='test@example.com', username='testuser')
    user.set_password('testpass123')
    session.add(user)
    session.commit()

    universe = Universe(
        name='Test Universe',
        description='A test universe',
        is_public=True,
        user_id=user.id
    )
    session.add(universe)
    session.commit()

    response = client.delete(f'/api/universes/{universe.id}',
                           headers=auth_headers)
    assert response.status_code == 200
    assert response.json['status'] == 'success'
    assert response.json['message'] == 'Universe deleted successfully'

    # Verify universe is deleted
    assert Universe.query.get(universe.id) is None

def test_create_universe_with_max_values(client, session, auth_headers):
    """Test creating a universe with maximum allowed parameter values."""
    data = {
        'name': 'X' * 255,  # Max title length
        'description': 'X' * 1000,  # Max description length
        'is_public': True,
        'physics_parameters': {
            'gravity': 1000.0,  # Max gravity
            'friction': 1.0,    # Max friction
            'elasticity': 1.0,  # Max elasticity
            'air_resistance': 1.0,
            'density': 1000.0   # Max density
        },
        'music_parameters': {
            'harmony': 1.0,
            'tempo': 300,      # Max tempo
            'key': 'B',
            'scale': 'chromatic'
        }
    }

    response = client.post('/api/universes',
                         json=data,
                         headers=auth_headers)
    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert response_data['universe']['name'] == 'X' * 255

def test_create_universe_concurrent(client, session, auth_headers):
    """Test creating multiple universes concurrently."""
    import threading
    import queue

    results = queue.Queue()
    num_universes = 5

    def create_universe(i):
        data = {
            'name': f'Concurrent Universe {i}',
            'description': f'Created in concurrent test {i}',
            'is_public': True,
            'physics_parameters': {
                'gravity': 9.81,
                'friction': 0.5
            },
            'music_parameters': {
                'harmony': 1.0,
                'tempo': 120
            }
        }
        response = client.post('/api/universes',
                             json=data,
                             headers=auth_headers)
        results.put((i, response.status_code))

    threads = []
    for i in range(num_universes):
        thread = threading.Thread(target=create_universe, args=(i,))
        threads.append(thread)
        thread.start()

    for thread in threads:
        thread.join()

    while not results.empty():
        _, status_code = results.get()
        assert status_code == 201

def test_create_universe_with_special_characters(client, session, auth_headers):
    """Test creating a universe with special characters in title and description."""
    data = {
        'name': '!@#$%^&*()_+-=[]{}|;:,.<>?',
        'description': '¡™£¢∞§¶•ªº–≠œ∑´®†¥¨ˆøπ"'
    }

    response = client.post('/api/universes',
                         json=data,
                         headers=auth_headers)
    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert response_data['universe']['name'] == '!@#$%^&*()_+-=[]{}|;:,.<>?'
