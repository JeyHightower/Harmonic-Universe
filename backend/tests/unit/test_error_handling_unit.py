import pytest
from unittest.mock import patch
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app import create_app
from app.models import User, Universe
from app.websocket import WebSocketService
from app.utils.error_handling import handle_database_error, handle_validation_error
from flask_socketio import SocketIO

@pytest.fixture
def app():
    """Create test application."""
    app = create_app('testing')
    return app

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture
def websocket_service(app):
    """Create WebSocket service instance."""
    socketio = SocketIO(app)
    service = WebSocketService(socketio)
    service.register_handlers()
    return service

def test_database_connection_error(client):
    """Test handling of database connection errors."""
    with patch('app.models.db.session.commit') as mock_commit:
        mock_commit.side_effect = SQLAlchemyError("Database connection failed")

        response = client.post('/api/universes',
                             json={
                                 'title': 'Test Universe',
                                 'description': 'Test description'
                             })

        assert response.status_code == 500
        data = response.get_json()
        assert 'error' in data
        assert 'database' in data['error'].lower()

def test_validation_errors(client):
    """Test handling of validation errors."""
    # Test missing required field
    response = client.post('/api/universes',
                          json={
                              'description': 'Test description'
                              # Missing title
                          })
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert 'title' in data['error'].lower()

    # Test invalid parameter values
    response = client.post('/api/universes',
                          json={
                              'title': 'Test Universe',
                              'description': 'Test description',
                              'physics_parameters': {
                                  'gravity': -1  # Invalid negative gravity
                              }
                          })
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert 'gravity' in data['error'].lower()

def test_duplicate_entry_error(client, session):
    """Test handling of duplicate entry errors."""
    # Create initial universe
    universe = Universe(title='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    # Try to create another universe with the same title
    response = client.post('/api/universes',
                          json={
                              'title': 'Test Universe',
                              'description': 'Duplicate title'
                          })
    assert response.status_code == 409
    data = response.get_json()
    assert 'error' in data
    assert 'already exists' in data['error'].lower()

def test_not_found_error(client):
    """Test handling of not found errors."""
    # Try to get non-existent universe
    response = client.get('/api/universes/999999')
    assert response.status_code == 404
    data = response.get_json()
    assert 'error' in data
    assert 'not found' in data['error'].lower()

def test_unauthorized_access(client, session):
    """Test handling of unauthorized access."""
    # Create a universe owned by user 1
    universe = Universe(title='Test Universe', user_id=1, is_public=False)
    session.add(universe)
    session.commit()

    # Try to access as user 2
    with patch('flask_jwt_extended.get_jwt_identity') as mock_jwt:
        mock_jwt.return_value = 2
        response = client.get(f'/api/universes/{universe.id}')
        assert response.status_code == 403
        data = response.get_json()
        assert 'error' in data
        assert 'unauthorized' in data['error'].lower()

def test_websocket_error_recovery(app, websocket_service):
    """Test WebSocket error recovery."""
    # Test connection handling
    sid = 'test_sid'
    user_id = 1

    # Test connection
    assert sid not in websocket_service.user_connections.get(user_id, set())
    websocket_service.user_connections[user_id] = {sid}
    assert sid in websocket_service.user_connections[user_id]

    # Test disconnection
    websocket_service.user_connections[user_id].remove(sid)
    assert sid not in websocket_service.user_connections[user_id]

    # Test room handling
    room_id = websocket_service.create_collaboration_room(
        universe_id=1,
        owner_id=user_id,
        max_participants=5,
        mode='view'
    )

    # Test room exists
    assert room_id in websocket_service.collaboration_rooms

    # Test cleanup
    websocket_service.cleanup_inactive_rooms()
    assert room_id in websocket_service.collaboration_rooms

def test_rate_limiting(client):
    """Test rate limiting error handling."""
    # Make multiple requests rapidly
    for _ in range(31):  # Assuming rate limit is 30 requests per minute
        response = client.post('/api/universes',
                             json={
                                 'title': 'Test Universe',
                                 'description': 'Test description'
                             })

    # Next request should be rate limited
    response = client.post('/api/universes',
                          json={
                              'title': 'Test Universe',
                              'description': 'Test description'
                          })
    assert response.status_code == 429
    data = response.get_json()
    assert 'error' in data
    assert 'rate limit' in data['error'].lower()

def test_transaction_rollback(session):
    """Test database transaction rollback on error."""
    initial_count = Universe.query.count()

    try:
        # Start a transaction that will fail
        universe1 = Universe(title='Universe 1', user_id=1)
        universe2 = Universe(title='Universe 1', user_id=1)  # Duplicate title
        session.add(universe1)
        session.add(universe2)
        session.commit()
    except IntegrityError:
        session.rollback()

    # Verify no universes were added
    final_count = Universe.query.count()
    assert final_count == initial_count

def test_error_logging(app, caplog):
    """Test error logging functionality."""
    with app.test_client() as client:
        # Trigger an error
        response = client.get('/api/universes/999999')
        assert response.status_code == 404

        # Verify error was logged
        assert any('404' in record.message for record in caplog.records)
        assert any('not found' in record.message.lower() for record in caplog.records)

def test_malformed_json_handling(client):
    """Test handling of malformed JSON data."""
    # Send invalid JSON
    response = client.post('/api/universes',
                          data='{"title": "Test Universe", invalid json',
                          content_type='application/json')
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert 'invalid json' in data['error'].lower()

def test_file_upload_errors(client):
    """Test handling of file upload errors."""
    # Test file too large
    large_file = 'x' * (16 * 1024 * 1024 + 1)  # Exceeds 16MB limit
    response = client.post('/api/universes/1/upload',
                          data={'file': (large_file, 'test.txt')})
    assert response.status_code == 413
    data = response.get_json()
    assert 'error' in data
    assert 'file too large' in data['error'].lower()

    # Test invalid file type
    response = client.post('/api/universes/1/upload',
                          data={'file': ('test.exe', 'test.exe')})
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert 'file type' in data['error'].lower()
