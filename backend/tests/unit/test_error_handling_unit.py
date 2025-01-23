"""Test error handling functionality."""
import pytest
from flask import Flask, jsonify
from werkzeug.exceptions import NotFound, Unauthorized, BadRequest
from app.utils.helpers.error_handlers import register_error_handlers
from app.extensions import db
from app.models.base.user import User
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from unittest.mock import patch
from app import create_app
from config import TestingConfig

@pytest.fixture
def app():
    """Create a test Flask application."""
    app = create_app(TestingConfig())
    return app

def test_database_connection_error(app, client):
    """Test handling of database connection errors."""
    with app.test_request_context():
        with patch.object(db.session, 'commit', side_effect=SQLAlchemyError('Test DB Error')):
            response = client.post('/api/universes',
                                 json={'name': 'Test Universe'},
                                 headers={'Content-Type': 'application/json'})
            assert response.status_code == 500
            assert response.json['status'] == 'error'
            assert response.json['error'] == 'Database Error'
            assert response.json['message'] == 'A database error occurred'

def test_validation_errors(app, client):
    """Test handling of validation errors."""
    response = client.post('/api/universes',
                         json={},
                         headers={'Content-Type': 'application/json'})
    assert response.status_code == 400
    assert response.json['status'] == 'error'
    assert response.json['error'] == 'Bad Request'
    assert response.json['message'] == 'Name is required'

def test_not_found_error(app, client):
    """Test handling of not found errors."""
    response = client.get('/api/universes/999999')
    assert response.status_code == 404
    assert response.json['status'] == 'error'
    assert response.json['error'] == 'Not Found'
    assert response.json['message'] == 'Universe not found'

def test_unauthorized_access(app, client):
    """Test handling of unauthorized access."""
    response = client.get('/api/universes/private')
    assert response.status_code == 401
    assert response.json['status'] == 'error'
    assert response.json['error'] == 'Unauthorized'
    assert response.json['message'] == 'Authentication required'

def test_rate_limiting(app, client):
    """Test rate limiting functionality."""
    for _ in range(100):  # Exceed rate limit
        response = client.get('/api/universes')
    assert response.status_code == 429
    assert response.json['status'] == 'error'
    assert response.json['error'] == 'Too Many Requests'
    assert response.json['message'] == 'Rate limit exceeded'

def test_malformed_json(app, client):
    """Test handling of malformed JSON."""
    response = client.post('/api/universes',
                         data='{"invalid": json',
                         content_type='application/json')
    assert response.status_code == 400
    assert response.json['status'] == 'error'
    assert response.json['error'] == 'Bad Request'
    assert response.json['message'] == 'Invalid JSON format'

def test_invalid_content_type(app, client):
    """Test handling of invalid content type."""
    response = client.post('/api/universes',
                         data='{"name": "Test"}',
                         content_type='text/plain')
    assert response.status_code == 415
    assert response.json['status'] == 'error'
    assert response.json['error'] == 'Unsupported Media Type'
    assert response.json['message'] == 'Content type must be application/json'

def test_request_timeout(app, client):
    """Test handling of request timeouts."""
    with patch('app.routes.universe_routes.create_universe',
              side_effect=TimeoutError('Test timeout')):
        response = client.post('/api/universes',
                             json={'name': 'Test Universe'},
                             headers={'Content-Type': 'application/json'})
        assert response.status_code == 500
        assert response.json['status'] == 'error'
        assert response.json['error'] == 'Internal Server Error'
        assert response.json['message'] == 'An unexpected error occurred'

def test_large_payload(app, client):
    """Test handling of large payloads."""
    large_data = {'name': 'x' * 1000000}  # Very large payload
    response = client.post('/api/universes',
                         json=large_data,
                         headers={'Content-Type': 'application/json'})
    assert response.status_code == 413
    assert response.json['status'] == 'error'
    assert response.json['error'] == 'Request Entity Too Large'
    assert response.json['message'] == 'The request is too large'

def test_file_upload_errors(app, client):
    """Test handling of file upload errors."""
    data = {'file': (b'invalid file content', 'test.txt')}
    response = client.post('/api/universes/upload',
                         data=data,
                         content_type='multipart/form-data')
    assert response.status_code == 400
    assert response.json['status'] == 'error'
    assert response.json['error'] == 'Bad Request'
    assert response.json['message'] == 'Invalid file'
