"""User profile tests."""
import pytest
from app.models import User

def test_get_profile(client, auth_headers, test_user):
    """Test getting user profile."""
    response = client.get(f'/api/users/{test_user.id}', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['username'] == test_user.username
    assert response.json['email'] == test_user.email

def test_update_profile(client, auth_headers, test_user):
    """Test updating user profile."""
    response = client.put(f'/api/users/{test_user.id}', json={
        'username': 'updated_user',
        'email': 'updated@example.com'
    }, headers=auth_headers)
    assert response.status_code == 200
    assert response.json['username'] == 'updated_user'
    assert response.json['email'] == 'updated@example.com'

def test_update_other_user_profile(client, auth_headers):
    """Test updating another user's profile."""
    # Create another user
    other_user = client.post('/api/auth/register', json={
        'username': 'other_user',
        'email': 'other@example.com',
        'password': 'password123'
    })
    other_id = other_user.json['user']['id']

    # Try to update other user's profile
    response = client.put(f'/api/users/{other_id}', json={
        'username': 'hacked'
    }, headers=auth_headers)
    assert response.status_code == 403

def test_delete_profile(client, auth_headers, test_user):
    """Test deleting user profile."""
    response = client.delete(f'/api/users/{test_user.id}', headers=auth_headers)
    assert response.status_code == 204

    # Try to get deleted profile
    response = client.get(f'/api/users/{test_user.id}', headers=auth_headers)
    assert response.status_code == 404

def test_get_user_universes(client, auth_headers, test_user, test_universe):
    """Test getting user's universes."""
    response = client.get(f'/api/users/{test_user.id}/universes', headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) > 0
    assert response.json[0]['name'] == test_universe.name

def test_invalid_profile_updates(client, auth_headers, test_user):
    """Test invalid profile updates."""
    # Try to update with invalid email
    response = client.put(f'/api/users/{test_user.id}', json={
        'email': 'invalid-email'
    }, headers=auth_headers)
    assert response.status_code == 400
    assert 'error' in response.json

    # Try to update with existing username
    client.post('/api/auth/register', json={
        'username': 'existing_user',
        'email': 'existing@example.com',
        'password': 'password123'
    })
    response = client.put(f'/api/users/{test_user.id}', json={
        'username': 'existing_user'
    }, headers=auth_headers)
    assert response.status_code == 400
    assert 'error' in response.json

def test_profile_validation(client, auth_headers):
    """Test profile validation rules."""
    # Test username length
    response = client.post('/api/auth/register', json={
        'username': 'a',  # Too short
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 400
    assert 'error' in response.json

    # Test password complexity
    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': '123'  # Too simple
    })
    assert response.status_code == 400
    assert 'error' in response.json
