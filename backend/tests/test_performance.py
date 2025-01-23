import pytest
import time
from concurrent.futures import ThreadPoolExecutor
from app import create_app
from app.extensions import db
from app.models import User, Universe

@pytest.fixture
def app():
    app = create_app('testing')
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def create_test_data(app):
    """Create test data for performance testing."""
    with app.app_context():
        # Create test user
        user = User(username='testuser', email='test@example.com')
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()

        # Create multiple universes
        for i in range(100):
            universe = Universe(
                name=f'Universe {i}',
                description=f'Description {i}',
                is_public=True,
                creator=user
            )
            db.session.add(universe)
        db.session.commit()

        return user

class TestPerformance:
    def test_universe_list_performance(self, app, client):
        """Test performance of universe listing."""
        user = create_test_data(app)

        # Measure response time
        start_time = time.time()
        response = client.get('/api/universes')
        end_time = time.time()

        assert response.status_code == 200
        assert end_time - start_time < 1.0  # Should respond within 1 second

    def test_universe_search_performance(self, app, client):
        """Test performance of universe search."""
        user = create_test_data(app)

        # Measure search performance
        start_time = time.time()
        response = client.get('/api/universes?search=Universe')
        end_time = time.time()

        assert response.status_code == 200
        assert end_time - start_time < 0.5  # Search should be fast

    def test_concurrent_requests(self, app, client):
        """Test handling of concurrent requests."""
        user = create_test_data(app)

        def make_request():
            return client.get('/api/universes')

        # Make 50 concurrent requests
        with ThreadPoolExecutor(max_workers=50) as executor:
            start_time = time.time()
            responses = list(executor.map(lambda _: make_request(), range(50)))
            end_time = time.time()

        # Check all responses were successful
        assert all(r.status_code == 200 for r in responses)

        # Check total time is reasonable
        total_time = end_time - start_time
        assert total_time < 5.0  # Should handle 50 requests within 5 seconds

    def test_websocket_performance(self, app, socket_client):
        """Test WebSocket performance with multiple clients."""
        user = create_test_data(app)

        # Create multiple WebSocket clients
        clients = [socket_client for _ in range(10)]

        # Measure time to broadcast to all clients
        start_time = time.time()
        for client in clients:
            client.emit('join', {'universe_id': 1})

        # Send update to all clients
        socket_client.emit('parameter_update', {
            'universe_id': 1,
            'type': 'physics',
            'parameters': {'gravity': 10.0}
        })

        # Wait for all clients to receive update
        time.sleep(0.1)
        end_time = time.time()

        # Check broadcast time
        assert end_time - start_time < 1.0

    def test_database_query_performance(self, app):
        """Test database query performance."""
        user = create_test_data(app)

        with app.app_context():
            # Test simple query
            start_time = time.time()
            universes = Universe.query.all()
            end_time = time.time()
            simple_query_time = end_time - start_time

            # Test complex query
            start_time = time.time()
            universes = Universe.query.filter(
                Universe.is_public == True
            ).order_by(
                Universe.created_at.desc()
            ).limit(10).all()
            end_time = time.time()
            complex_query_time = end_time - start_time

            assert simple_query_time < 0.1  # Simple queries should be very fast
            assert complex_query_time < 0.2  # Complex queries should be reasonably fast

    def test_memory_usage(self, app, client):
        """Test memory usage under load."""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss

        # Create test data and make requests
        user = create_test_data(app)
        for _ in range(100):
            client.get('/api/universes')

        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory

        # Memory increase should be reasonable
        assert memory_increase < 50 * 1024 * 1024  # Less than 50MB increase
