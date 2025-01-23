import pytest
import json
from flask import url_for
from flask_socketio import SocketIOTestClient
from app import create_app
from app.extensions import db
from app.models.base import User, Universe, VisualizationParameters
from app.websocket import WebSocketService

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def socketio_client(app):
    socketio = app.websocket_manager.socketio
    return SocketIOTestClient(app, socketio)

@pytest.fixture
def test_user(app):
    user = User(username='testuser', email='test@example.com')
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def test_universe(test_user):
    universe = Universe(
        title='Test Universe',
        description='Test Description',
        user_id=test_user.id,
        is_public=True
    )
    db.session.add(universe)
    db.session.commit()

    # Add visualization parameters
    vis_params = VisualizationParameters(
        universe_id=universe.id,
        color_scheme='default',
        particle_density=1000,
        particle_size=2.0,
        blur_amount=0.5,
        glow_intensity=0.7
    )
    db.session.add(vis_params)
    db.session.commit()
    return universe

def test_visualization_parameter_update(app, client, socketio_client, test_user, test_universe):
    """Test real-time visualization parameter updates."""
    # Login
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    token = json.loads(response.data)['token']

    # Connect to WebSocket
    socketio_client.connect(headers={'Authorization': f'Bearer {token}'})
    assert socketio_client.is_connected()

    # Subscribe to universe updates
    socketio_client.emit('subscribe', {'universe_id': test_universe.id})
    response = socketio_client.get_received()
    assert response[0]['name'] == 'subscribe_response'
    assert response[0]['args'][0]['success'] is True

    # Update visualization parameters
    new_params = {
        'color_scheme': 'dark',
        'particle_density': 1500,
        'particle_size': 2.5,
        'blur_amount': 0.7,
        'glow_intensity': 0.8
    }
    socketio_client.emit('visualization_update', {
        'universe_id': test_universe.id,
        'data': new_params
    })

    # Check response
    response = socketio_client.get_received()
    assert response[0]['name'] == 'visualization_update_response'
    assert response[0]['args'][0]['success'] is True

    # Verify database update
    with app.app_context():
        vis_params = VisualizationParameters.query.filter_by(universe_id=test_universe.id).first()
        assert vis_params.color_scheme == new_params['color_scheme']
        assert vis_params.particle_density == new_params['particle_density']
        assert vis_params.particle_size == new_params['particle_size']
        assert vis_params.blur_amount == new_params['blur_amount']
        assert vis_params.glow_intensity == new_params['glow_intensity']

def test_visualization_parameter_validation(app, client, socketio_client, test_user, test_universe):
    """Test validation of visualization parameter updates."""
    # Login
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    token = json.loads(response.data)['token']

    # Connect to WebSocket
    socketio_client.connect(headers={'Authorization': f'Bearer {token}'})
    assert socketio_client.is_connected()

    # Subscribe to universe updates
    socketio_client.emit('subscribe', {'universe_id': test_universe.id})
    response = socketio_client.get_received()
    assert response[0]['name'] == 'subscribe_response'
    assert response[0]['args'][0]['success'] is True

    # Test invalid color scheme
    invalid_params = {
        'color_scheme': 'invalid_scheme',
        'particle_density': 1500,
        'particle_size': 2.5,
        'blur_amount': 0.7,
        'glow_intensity': 0.8
    }
    socketio_client.emit('visualization_update', {
        'universe_id': test_universe.id,
        'data': invalid_params
    })
    response = socketio_client.get_received()
    assert response[0]['name'] == 'error'

    # Test invalid particle density
    invalid_params = {
        'color_scheme': 'dark',
        'particle_density': -100,  # Invalid negative value
        'particle_size': 2.5,
        'blur_amount': 0.7,
        'glow_intensity': 0.8
    }
    socketio_client.emit('visualization_update', {
        'universe_id': test_universe.id,
        'data': invalid_params
    })
    response = socketio_client.get_received()
    assert response[0]['name'] == 'error'

def test_visualization_parameter_permissions(app, client, socketio_client, test_user, test_universe):
    """Test permissions for visualization parameter updates."""
    # Create another user
    other_user = User(username='otheruser', email='other@example.com')
    other_user.set_password('password123')
    with app.app_context():
        db.session.add(other_user)
        db.session.commit()

    # Login as other user
    response = client.post('/api/auth/login', json={
        'email': 'other@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    token = json.loads(response.data)['token']

    # Connect to WebSocket
    socketio_client.connect(headers={'Authorization': f'Bearer {token}'})
    assert socketio_client.is_connected()

    # Try to update visualization parameters of another user's universe
    new_params = {
        'color_scheme': 'dark',
        'particle_density': 1500,
        'particle_size': 2.5,
        'blur_amount': 0.7,
        'glow_intensity': 0.8
    }
    socketio_client.emit('visualization_update', {
        'universe_id': test_universe.id,
        'data': new_params
    })

    # Check response
    response = socketio_client.get_received()
    assert response[0]['name'] == 'error'
    assert 'unauthorized' in response[0]['args'][0]['message'].lower()

def test_visualization_parameter_broadcast(app, client, socketio_client, test_user, test_universe):
    """Test broadcasting of visualization parameter updates to subscribed clients."""
    # Create two clients
    client1 = socketio_client
    client2 = SocketIOTestClient(app, app.websocket_manager.socketio)

    # Login both clients
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    token = json.loads(response.data)['token']

    # Connect and subscribe both clients
    for client in [client1, client2]:
        client.connect(headers={'Authorization': f'Bearer {token}'})
        assert client.is_connected()
        client.emit('subscribe', {'universe_id': test_universe.id})
        response = client.get_received()
        assert response[0]['name'] == 'subscribe_response'
        assert response[0]['args'][0]['success'] is True

    # Update visualization parameters from client1
    new_params = {
        'color_scheme': 'dark',
        'particle_density': 1500,
        'particle_size': 2.5,
        'blur_amount': 0.7,
        'glow_intensity': 0.8
    }
    client1.emit('visualization_update', {
        'universe_id': test_universe.id,
        'data': new_params
    })

    # Check that both clients received the update
    for client in [client1, client2]:
        response = client.get_received()
        assert len(response) > 0
        assert response[-1]['name'] == 'visualization_update'
        assert response[-1]['args'][0]['data'] == new_params
