import pytest
import time
from concurrent.futures import ThreadPoolExecutor
from ..factories import UniverseFactory, SceneFactory, UserFactory


def test_universe_list_performance(client, auth_headers, test_user):
    """Test performance of universe listing endpoint"""
    # Create many universes
    universes = [UniverseFactory(creator=test_user) for _ in range(100)]

    # Measure response time
    start_time = time.time()
    response = client.get("/api/universes", headers=auth_headers)
    end_time = time.time()

    assert response.status_code == 200
    assert end_time - start_time < 0.5  # Should respond in under 500ms


def test_scene_rendering_performance(client, auth_headers, test_scene):
    """Test performance of scene rendering"""
    # Add many physics objects to the scene
    service = PhysicsService()
    for _ in range(100):
        service.create_physics_object(
            name=f"Object {i}",
            object_type="circle",
            position={"x": 0, "y": 0},
            velocity={"x": 0, "y": 0},
            mass=1.0,
            scene_id=test_scene.id,
        )

    # Measure render time
    start_time = time.time()
    response = client.get(f"/api/scenes/{test_scene.id}/render", headers=auth_headers)
    end_time = time.time()

    assert response.status_code == 200
    assert end_time - start_time < 1.0  # Should render in under 1 second


def test_concurrent_users(client, auth_headers):
    """Test system performance with concurrent users"""

    def make_request():
        return client.get("/api/universes", headers=auth_headers)

    # Simulate 50 concurrent users
    with ThreadPoolExecutor(max_workers=50) as executor:
        start_time = time.time()
        responses = list(executor.map(make_request, range(50)))
        end_time = time.time()

    # Check all responses were successful
    assert all(r.status_code == 200 for r in responses)

    # Calculate average response time
    avg_response_time = (end_time - start_time) / 50
    assert avg_response_time < 0.1  # Average response under 100ms


def test_websocket_performance(socketio_client, test_scene):
    """Test WebSocket performance under load"""
    # Create many clients
    clients = [socketio_client for _ in range(20)]

    # Join scene room
    for client in clients:
        client.emit("join", {"scene_id": test_scene.id})

    # Measure broadcast time
    start_time = time.time()

    # Broadcast update to all clients
    update_data = {
        "scene_id": test_scene.id,
        "object_id": 1,
        "position": {"x": 100, "y": 100},
    }
    clients[0].emit("update_object", update_data)

    # Wait for all clients to receive update
    received = [False for _ in range(len(clients))]
    timeout = time.time() + 1.0  # 1 second timeout

    while not all(received) and time.time() < timeout:
        for i, client in enumerate(clients):
            if not received[i]:
                messages = client.get_received()
                if any(m["name"] == "object_updated" for m in messages):
                    received[i] = True

    broadcast_time = time.time() - start_time
    assert broadcast_time < 0.5  # Broadcast should complete in under 500ms
    assert all(received)  # All clients should receive the update


def test_database_query_performance(app, test_user):
    """Test database query performance"""
    with app.app_context():
        # Create complex data structure
        universe = UniverseFactory(creator=test_user)
        scenes = [SceneFactory(universe=universe) for _ in range(10)]

        # Measure query time for complex join
        start_time = time.time()
        result = (
            Universe.query.join(Scene)
            .filter(Universe.creator_id == test_user.id)
            .options(joinedload(Universe.scenes))
            .all()
        )
        query_time = time.time() - start_time

        assert query_time < 0.1  # Complex query should complete in under 100ms
