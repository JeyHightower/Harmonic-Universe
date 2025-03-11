import pytest
from app.exceptions import (
    UniverseNotFoundError,
    UnauthorizedError,
    ValidationError,
    ResourceConflictError
)
from app.models import Universe, Scene, User
from ..factories import UniverseFactory, UserFactory

def test_404_handler(client):
    """Test handling of 404 Not Found errors"""
    response = client.get('/api/nonexistent-endpoint')
    assert response.status_code == 404
    assert 'error' in response.json
    assert 'message' in response.json

def test_500_handler(client, app):
    """Test handling of 500 Internal Server Error"""
    # Create a route that raises an exception
    @app.route('/api/test-500')
    def test_500():
        raise Exception('Test internal error')

    response = client.get('/api/test-500')
    assert response.status_code == 500
    assert 'error' in response.json
    assert 'message' in response.json

def test_validation_error_handler(client, auth_headers):
    """Test handling of validation errors"""
    # Try to create a universe with invalid data
    invalid_data = {
        'name': '',  # Empty name should trigger validation error
        'description': 'Test description'
    }

    response = client.post('/api/universes', json=invalid_data, headers=auth_headers)
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'validation_errors' in response.json

def test_unauthorized_error_handler(client):
    """Test handling of unauthorized access"""
    # Try to access protected route without auth
    response = client.get('/api/universes')
    assert response.status_code == 401
    assert 'error' in response.json
    assert 'message' in response.json

def test_resource_conflict_handler(client, auth_headers, test_user):
    """Test handling of resource conflicts"""
    # Create a universe
    universe_data = {
        'name': 'Test Universe',
        'description': 'Test description'
    }
    response = client.post('/api/universes', json=universe_data, headers=auth_headers)

    # Try to create another universe with the same name
    response = client.post('/api/universes', json=universe_data, headers=auth_headers)
    assert response.status_code == 409
    assert 'error' in response.json
    assert 'message' in response.json

def test_rate_limit_handler(client, auth_headers):
    """Test handling of rate limiting"""
    # Make multiple requests quickly
    for _ in range(100):
        client.get('/api/universes', headers=auth_headers)

    response = client.get('/api/universes', headers=auth_headers)
    assert response.status_code == 429
    assert 'error' in response.json
    assert 'retry_after' in response.json

def test_file_size_limit_handler(client, auth_headers):
    """Test handling of file size limits"""
    # Create a large file that exceeds the limit
    large_data = 'x' * (10 * 1024 * 1024)  # 10MB
    files = {'file': ('test.txt', large_data)}

    response = client.post('/api/upload', files=files, headers=auth_headers)
    assert response.status_code == 413
    assert 'error' in response.json
    assert 'message' in response.json

def test_database_error_handler(client, auth_headers, app):
    """Test handling of database errors"""
    # Create a route that triggers a database error
    @app.route('/api/test-db-error')
    def test_db_error():
        # Attempt an invalid database operation
        Universe.query.filter_by(id=-1).one()

    response = client.get('/api/test-db-error')
    assert response.status_code == 500
    assert 'error' in response.json
    assert 'message' in response.json
