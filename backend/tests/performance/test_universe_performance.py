"""Test universe performance."""
import pytest
import time
from app.models.base import Universe, User
from app.extensions import db

def test_universe_creation_performance(client, session, auth_headers):
    """Test performance of universe creation."""
    start_time = time.time()
    total_universes = 10

    for i in range(total_universes):
        response = client.post('/api/universes',
                             json={'name': f'Universe {i}'},
                             headers=auth_headers)
        assert response.status_code == 201
        assert response.json['universe']['name'] == f'Universe {i}'

    end_time = time.time()
    total_time = end_time - start_time
    average_time = total_time / total_universes

    # Average creation time should be under 500ms
    assert average_time < 0.5
    # Total time should be under 5 seconds
    assert total_time < 5.0

def test_universe_query_performance(client, session, auth_headers):
    """Test performance of universe queries."""
    # Create test universes
    universes = []
    for i in range(10):
        universe = Universe(name=f'Universe {i}')
        session.add(universe)
        universes.append(universe)
    session.commit()

    start_time = time.time()

    # Test different query operations
    response = client.get('/api/universes')
    assert response.status_code == 200

    response = client.get('/api/universes/search?q=Universe')
    assert response.status_code == 200

    response = client.get('/api/universes/public')
    assert response.status_code == 200

    end_time = time.time()
    query_time = end_time - start_time

    # Query completion should be under 200ms
    assert query_time < 0.2

def test_universe_update_performance(client, session, auth_headers):
    """Test performance of universe updates."""
    # Create test universes
    universes = []
    for i in range(10):
        universe = Universe(name=f'Universe {i}')
        session.add(universe)
        universes.append(universe)
    session.commit()

    start_time = time.time()

    for universe in universes:
        response = client.put(f'/api/universes/{universe.id}',
                            json={'name': f'Updated Universe {universe.id}'},
                            headers=auth_headers)
        assert response.status_code == 200
        assert response.json['universe']['name'] == f'Updated Universe {universe.id}'

    end_time = time.time()
    total_time = end_time - start_time
    average_time = total_time / len(universes)

    # Average update time should be under 200ms
    assert average_time < 0.2
    # Total time should be under 3 seconds
    assert total_time < 3.0

def test_universe_deletion_performance(client, session, auth_headers):
    """Test performance of universe deletion."""
    # Create test universes
    universes = []
    for i in range(10):
        universe = Universe(name=f'Universe {i}')
        session.add(universe)
        universes.append(universe)
    session.commit()

    start_time = time.time()

    for universe in universes:
        response = client.delete(f'/api/universes/{universe.id}',
                               headers=auth_headers)
        assert response.status_code == 200
        assert response.json['status'] == 'success'
        assert response.json['message'] == 'Universe deleted successfully'

    end_time = time.time()
    total_time = end_time - start_time
    average_time = total_time / len(universes)

    # Average deletion time should be under 200ms
    assert average_time < 0.2
    # Total time should be under 2 seconds
    assert total_time < 2.0
