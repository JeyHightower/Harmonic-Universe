import pytest
from flask import json
from app import create_app
from ...config import TestConfig

@pytest.fixture
def app():
    app = create_app(TestConfig)
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    # Register and login to get token
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    data = json.loads(response.data)
    token = data['data']['token']
    return {'Authorization': f'Bearer {token}'}

def test_get_notifications(client, auth_headers):
    response = client.get('/api/notifications', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)

def test_create_notification(client, auth_headers):
    response = client.post('/api/notifications', json={
        'message': 'Test notification',
        'type': 'info'
    }, headers=auth_headers)
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['message'] == 'Test notification'
    assert 'id' in data
    assert 'timestamp' in data
    assert not data['read']

def test_mark_notification_read(client, auth_headers):
    # Create a notification first
    create_response = client.post('/api/notifications', json={
        'message': 'Test notification',
        'type': 'info'
    }, headers=auth_headers)
    notification_id = json.loads(create_response.data)['id']

    response = client.patch(f'/api/notifications/{notification_id}', json={
        'read': True
    }, headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['read'] == True

def test_delete_notification(client, auth_headers):
    # Create a notification first
    create_response = client.post('/api/notifications', json={
        'message': 'Test notification',
        'type': 'info'
    }, headers=auth_headers)
    notification_id = json.loads(create_response.data)['id']

    response = client.delete(f'/api/notifications/{notification_id}', headers=auth_headers)
    assert response.status_code == 204

    # Verify it's deleted
    get_response = client.get('/api/notifications', headers=auth_headers)
    data = json.loads(get_response.data)
    assert len([n for n in data if n['id'] == notification_id]) == 0

def test_mark_all_notifications_read(client, auth_headers):
    # Create multiple notifications
    client.post('/api/notifications', json={
        'message': 'Test notification 1',
        'type': 'info'
    }, headers=auth_headers)
    client.post('/api/notifications', json={
        'message': 'Test notification 2',
        'type': 'info'
    }, headers=auth_headers)

    response = client.post('/api/notifications/mark-all-read', headers=auth_headers)
    assert response.status_code == 200

    # Verify all are marked as read
    get_response = client.get('/api/notifications', headers=auth_headers)
    data = json.loads(get_response.data)
    assert all(n['read'] for n in data)

def test_get_notifications_no_auth(client):
    response = client.get('/api/notifications')
    assert response.status_code == 401

def test_create_notification_invalid_data(client, auth_headers):
    response = client.post('/api/notifications', json={
        'message': '',  # Invalid empty message
        'type': 'invalid_type'  # Invalid type
    }, headers=auth_headers)
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
