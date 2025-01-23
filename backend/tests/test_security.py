import pytest
from app import create_app
from app.extensions import db
import json
import re

@pytest.fixture
def app():
    app = create_app('testing')
    return app

@pytest.fixture
def client(app):
    return app.test_client()

class TestSecurity:
    def test_sql_injection(self, client):
        """Test SQL injection prevention."""
        # Try SQL injection in login
        payload = {
            'email': "' OR '1'='1",
            'password': "' OR '1'='1"
        }
        response = client.post('/api/auth/login', json=payload)
        assert response.status_code == 401

        # Try SQL injection in universe search
        response = client.get('/api/universes?search=\' OR \'1\'=\'1')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 0  # Should not return all universes

    def test_xss_prevention(self, client, auth_headers):
        """Test Cross-Site Scripting (XSS) prevention."""
        # Try XSS in universe name
        payload = {
            'name': '<script>alert("xss")</script>Test Universe',
            'description': 'Test Description'
        }
        response = client.post('/api/universes', json=payload, headers=auth_headers)
        assert response.status_code == 201
        data = json.loads(response.data)
        assert '<script>' not in data['name']

        # Try XSS in profile bio
        payload = {
            'bio': '<img src="x" onerror="alert(\'xss\')">'
        }
        response = client.put('/api/profile', json=payload, headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert '<img' not in data['bio']

    def test_csrf_protection(self, client):
        """Test CSRF protection."""
        # Try request without CSRF token
        headers = {'X-Requested-With': 'XMLHttpRequest'}
        response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'password123'
        }, headers=headers)
        assert response.status_code != 403

        # Ensure CSRF token is required for non-GET requests
        response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'password123'
        })
        assert 'csrf_token' in response.headers.get('Set-Cookie', '')

    def test_rate_limiting(self, client):
        """Test rate limiting."""
        # Make multiple rapid requests
        for _ in range(50):
            response = client.post('/api/auth/login', json={
                'email': 'test@example.com',
                'password': 'wrong'
            })

        # Next request should be rate limited
        response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'wrong'
        })
        assert response.status_code == 429

    def test_password_security(self, client):
        """Test password security requirements."""
        # Try weak password
        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': '123'
        })
        assert response.status_code == 400

        # Try common password
        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password'
        })
        assert response.status_code == 400

        # Try strong password
        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'StrongP@ssw0rd123'
        })
        assert response.status_code == 201

    def test_jwt_security(self, client):
        """Test JWT token security."""
        # Login to get token
        response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'StrongP@ssw0rd123'
        })
        assert response.status_code == 200
        token = json.loads(response.data)['token']

        # Verify token format
        assert re.match(r'^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$', token)

        # Try expired token
        expired_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiZXhwIjoxNTE2MjM5MDIyfQ.2hDgYnF7_6UUvMQ7PFj8nP3zWWjEX5WFNhiWJ6K7Xl0'
        response = client.get('/api/profile', headers={'Authorization': f'Bearer {expired_token}'})
        assert response.status_code == 401

    def test_file_upload_security(self, client, auth_headers):
        """Test file upload security."""
        # Try to upload executable
        data = {
            'file': (b'#!/bin/bash\necho "malicious"', 'test.sh')
        }
        response = client.post('/api/profile/avatar', data=data, headers=auth_headers)
        assert response.status_code == 400

        # Try to upload large file
        large_data = b'0' * (10 * 1024 * 1024)  # 10MB
        data = {
            'file': (large_data, 'large.jpg')
        }
        response = client.post('/api/profile/avatar', data=data, headers=auth_headers)
        assert response.status_code == 400
