"""Test suite for performance testing."""
import pytest
import time
import concurrent.futures
from app.models import Universe, Storyboard, Scene, PhysicsObject
from .factories import (
    UserFactory, UniverseFactory, StoryboardFactory,
    SceneFactory, PhysicsObjectFactory
)

def test_database_query_performance(client, auth_headers):
    """Test database query performance."""
    # Create large dataset
    universe = UniverseFactory()
    storyboards = [StoryboardFactory(universe=universe) for _ in range(10)]
    for storyboard in storyboards:
        scenes = [SceneFactory(storyboard=storyboard) for _ in range(10)]
        for scene in scenes:
            [PhysicsObjectFactory(scene=scene) for _ in range(20)]

    # Test universe retrieval time
    start_time = time.time()
    response = client.get(f'/api/universes/{universe.id}', headers=auth_headers)
    end_time = time.time()

    assert response.status_code == 200
    assert end_time - start_time < 0.5  # Should respond within 500ms

    # Test scene list retrieval time
    start_time = time.time()
    response = client.get(f'/api/universes/{universe.id}/scenes', headers=auth_headers)
    end_time = time.time()

    assert response.status_code == 200
    assert end_time - start_time < 1.0  # Should respond within 1 second

def test_physics_simulation_performance(client, auth_headers):
    """Test physics simulation performance."""
    scene = SceneFactory(
        physics_settings={
            'gravity': {'x': 0, 'y': -9.81},
            'enabled': True
        }
    )

    # Create many physics objects
    objects = [
        PhysicsObjectFactory(
            scene=scene,
            position={'x': i * 10, 'y': 100},
            velocity={'x': 0, 'y': 0}
        )
        for i in range(100)
    ]

    # Measure simulation step time
    start_time = time.time()
    response = client.post(f'/api/scenes/{scene.id}/physics/step',
        json={'dt': 1/60},
        headers=auth_headers
    )
    end_time = time.time()

    assert response.status_code == 200
    assert end_time - start_time < 0.016  # Should complete within one frame (60 FPS)

def test_concurrent_requests(client, auth_headers):
    """Test handling of concurrent requests."""
    universe = UniverseFactory()

    def make_request():
        return client.get(f'/api/universes/{universe.id}', headers=auth_headers)

    # Make concurrent requests
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request) for _ in range(50)]
        responses = [f.result() for f in futures]

    # Verify all requests succeeded
    assert all(r.status_code == 200 for r in responses)

def test_websocket_performance(authenticated_websocket_client, scene):
    """Test WebSocket performance under load."""
    # Join scene
    authenticated_websocket_client.emit('join_scene', {'scene_id': scene.id})
    authenticated_websocket_client.get_received()

    # Send rapid updates
    start_time = time.time()
    for i in range(100):
        authenticated_websocket_client.emit('cursor_move', {
            'scene_id': scene.id,
            'position': {'x': i, 'y': i}
        })
    end_time = time.time()

    # Verify messages were processed
    received = authenticated_websocket_client.get_received()
    assert len(received) > 0
    assert end_time - start_time < 1.0  # Should process 100 messages within 1 second

def test_media_processing_performance(client, auth_headers):
    """Test media processing performance."""
    scene = SceneFactory()

    # Create multiple visual effects
    start_time = time.time()
    for i in range(10):
        response = client.post(f'/api/scenes/{scene.id}/visual-effects',
            json={
                'name': f'Effect {i}',
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
    end_time = time.time()

    assert end_time - start_time < 2.0  # Should create 10 effects within 2 seconds

def test_search_performance(client, auth_headers):
    """Test search functionality performance."""
    # Create searchable content
    for i in range(100):
        UniverseFactory(name=f'Test Universe {i}')

    # Test search response time
    start_time = time.time()
    response = client.get('/api/universes/search?q=Test', headers=auth_headers)
    end_time = time.time()

    assert response.status_code == 200
    assert end_time - start_time < 0.5  # Should search within 500ms

def test_memory_usage(client, auth_headers):
    """Test memory usage under load."""
    import psutil
    import os

    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss

    # Create large dataset
    universes = [UniverseFactory() for _ in range(10)]
    for universe in universes:
        [StoryboardFactory(universe=universe) for _ in range(5)]

    # Make requests to load data
    for universe in universes:
        response = client.get(f'/api/universes/{universe.id}', headers=auth_headers)
        assert response.status_code == 200

    final_memory = process.memory_info().rss
    memory_increase = final_memory - initial_memory

    # Memory increase should be reasonable
    assert memory_increase < 100 * 1024 * 1024  # Less than 100MB increase

def test_database_connection_pool(client, auth_headers):
    """Test database connection pool performance."""
    from sqlalchemy import create_engine
    from app import db

    # Get initial pool statistics
    engine = db.engine
    initial_connections = engine.pool.size()

    # Make concurrent database requests
    def make_db_request():
        response = client.get('/api/universes', headers=auth_headers)
        assert response.status_code == 200

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(make_db_request) for _ in range(50)]
        concurrent.futures.wait(futures)

    # Check pool didn't grow too large
    final_connections = engine.pool.size()
    assert final_connections - initial_connections < 10  # Pool growth should be limited

def test_caching_performance(client, auth_headers):
    """Test caching system performance."""
    universe = UniverseFactory()

    # First request (uncached)
    start_time = time.time()
    response1 = client.get(f'/api/universes/{universe.id}', headers=auth_headers)
    uncached_time = time.time() - start_time

    # Second request (should be cached)
    start_time = time.time()
    response2 = client.get(f'/api/universes/{universe.id}', headers=auth_headers)
    cached_time = time.time() - start_time

    assert response1.status_code == response2.status_code == 200
    assert cached_time < uncached_time / 2  # Cached response should be significantly faster

def test_bulk_operations_performance(client, auth_headers):
    """Test bulk operation performance."""
    universe = UniverseFactory()

    # Test bulk object creation
    objects_data = [
        {
            'name': f'Object {i}',
            'object_type': 'circle',
            'position': {'x': i * 10, 'y': 0}
        }
        for i in range(100)
    ]

    start_time = time.time()
    response = client.post(f'/api/universes/{universe.id}/bulk-create',
        json={'objects': objects_data},
        headers=auth_headers
    )
    end_time = time.time()

    assert response.status_code == 201
    assert end_time - start_time < 2.0  # Should create 100 objects within 2 seconds
