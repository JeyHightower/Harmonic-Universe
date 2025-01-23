import asyncio
import pytest
import time
from concurrent.futures import ThreadPoolExecutor
from app import create_app
from app.models.base import User, Universe
from app.websocket import WebSocketService
from flask import Flask
from flask_socketio import SocketIO
from app.config import Config
from app.extensions import db, migrate, jwt

@pytest.fixture
def app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    socketio = SocketIO(app)
    websocket_service = WebSocketService(socketio)
    websocket_service.register_handlers()

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

def test_concurrent_universe_creation(client, session):
    """Test creating multiple universes concurrently."""
    n_universes = 100
    start_time = time.time()

    def create_universe(i):
        response = client.post('/api/universes',
                             json={
                                 'title': f'Universe {i}',
                                 'description': f'Test universe {i}',
                                 'is_public': True
                             })
        assert response.status_code == 201
        return response

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(create_universe, range(n_universes)))

    end_time = time.time()
    duration = end_time - start_time

    assert len(results) == n_universes
    assert duration < 10  # Should complete within 10 seconds

def test_concurrent_websocket_connections(app):
    """Test handling multiple WebSocket connections."""
    n_clients = 100
    manager = WebSocketService()
    clients = []

    start_time = time.time()

    # Create and connect multiple clients
    for i in range(n_clients):
        client = WebSocketService()
        client.connect()
        clients.append(client)

    # Send messages from all clients simultaneously
    def send_messages(client):
        for j in range(10):
            client.send({
                'type': 'message',
                'content': f'test message {j}'
            })

    with ThreadPoolExecutor(max_workers=20) as executor:
        executor.map(send_messages, clients)

    end_time = time.time()
    duration = end_time - start_time

    # Verify all clients are connected and messages were processed
    assert len(manager.clients) == n_clients
    assert duration < 5  # Should complete within 5 seconds

    # Cleanup
    for client in clients:
        client.disconnect()

@pytest.mark.asyncio
async def test_realtime_parameter_updates(app, session):
    """Test performance of real-time parameter updates."""
    universe = Universe(title='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    n_updates = 1000
    start_time = time.time()

    # Simulate rapid parameter updates
    for i in range(n_updates):
        universe.physics_parameters.gravity = i % 10
        universe.physics_parameters.friction = (i % 10) / 10
        session.commit()

    end_time = time.time()
    duration = end_time - start_time

    assert duration < 5  # Should complete within 5 seconds

def test_database_query_performance(app, session):
    """Test database query performance."""
    # Create test data
    n_universes = 1000
    universes = []
    for i in range(n_universes):
        universe = Universe(
            title=f'Universe {i}',
            description=f'Test universe {i}',
            is_public=i % 2 == 0,
            user_id=1
        )
        universes.append(universe)

    session.add_all(universes)
    session.commit()

    # Test various query scenarios
    start_time = time.time()

    # Test filtering
    public_universes = Universe.query.filter_by(is_public=True).all()
    assert len(public_universes) == n_universes // 2

    # Test searching
    search_results = Universe.query.filter(
        Universe.title.ilike('%Universe 5%')
    ).all()
    assert len(search_results) > 0

    # Test ordering
    ordered_universes = Universe.query.order_by(Universe.created_at.desc()).all()
    assert len(ordered_universes) == n_universes

    end_time = time.time()
    duration = end_time - start_time

    assert duration < 1  # All queries should complete within 1 second

@pytest.mark.asyncio
async def test_websocket_broadcast_performance(app):
    """Test WebSocket broadcast performance under load."""
    manager = WebSocketService()
    n_clients = 100
    n_messages = 100

    # Create and connect clients
    clients = [WebSocketService() for _ in range(n_clients)]
    for client in clients:
        client.connect()
        client.subscribe(1)  # All clients subscribe to the same universe

    start_time = time.time()

    # Broadcast messages
    for i in range(n_messages):
        manager.broadcast({
            'type': 'update',
            'data': f'test message {i}'
        }, universe_id=1)

    # Verify message reception
    for client in clients:
        messages = []
        while True:
            msg = client.receive()
            if msg is None:
                break
            messages.append(msg)
        assert len(messages) == n_messages

    end_time = time.time()
    duration = end_time - start_time

    assert duration < 5  # Should complete within 5 seconds

def test_memory_usage(app, session):
    """Test memory usage under load."""
    import psutil
    import os

    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss

    # Create large number of objects
    n_objects = 10000
    objects = []
    for i in range(n_objects):
        universe = Universe(
            title=f'Universe {i}',
            description='x' * 1000,  # Large description
            is_public=True,
            user_id=1
        )
        objects.append(universe)

    session.add_all(objects)
    session.commit()

    final_memory = process.memory_info().rss
    memory_increase = final_memory - initial_memory

    # Memory increase should be reasonable
    assert memory_increase < 100 * 1024 * 1024  # Less than 100MB increase
