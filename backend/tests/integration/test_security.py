"""Test suite for security features."""
import pytest
import jwt
from datetime import datetime, timedelta
from app.models import User, Universe, UniverseAccess
from app.security import generate_token, verify_token
from .factories import UserFactory, UniverseFactory

def test_user_authentication(client):
    """Test user authentication process."""
    # Register user
    register_response = client.post('/api/auth/register',
        json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'SecurePass123!'
        }
    )
    assert register_response.status_code == 201

    # Login with correct credentials
    login_response = client.post('/api/auth/login',
        json={
            'email': 'test@example.com',
            'password': 'SecurePass123!'
        }
    )
    assert login_response.status_code == 200
    assert 'access_token' in login_response.json

    # Try login with incorrect password
    wrong_login = client.post('/api/auth/login',
        json={
            'email': 'test@example.com',
            'password': 'WrongPass123!'
        }
    )
    assert wrong_login.status_code == 401

def test_password_security(client):
    """Test password security features."""
    # Test weak passwords
    weak_passwords = [
        'short',           # Too short
        'nodigits',       # No numbers
        'no-special',     # No special characters
        'all-lowercase',  # No uppercase
        '12345678',       # Only numbers
    ]

    for password in weak_passwords:
        response = client.post('/api/auth/register',
            json={
                'username': 'testuser',
                'email': 'test@example.com',
                'password': password
            }
        )
        assert response.status_code == 400
        assert 'password' in response.json['message'].lower()

def test_token_security(app, user):
    """Test JWT token security."""
    # Generate token
    token = generate_token(user)

    # Verify valid token
    decoded = verify_token(token)
    assert decoded['sub'] == str(user.id)

    # Test expired token
    expired_token = jwt.encode(
        {
            'sub': str(user.id),
            'exp': datetime.utcnow() - timedelta(hours=1)
        },
        app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    with pytest.raises(jwt.ExpiredSignatureError):
        verify_token(expired_token)

    # Test tampered token
    tampered_token = token[:-1] + ('1' if token[-1] == '0' else '0')
    with pytest.raises(jwt.InvalidTokenError):
        verify_token(tampered_token)

def test_rate_limiting(client):
    """Test rate limiting protection."""
    # Make multiple rapid requests
    responses = []
    for _ in range(100):
        response = client.post('/api/auth/login',
            json={
                'email': 'test@example.com',
                'password': 'password123'
            }
        )
        responses.append(response)
        if response.status_code == 429:  # Too Many Requests
            break

    assert any(r.status_code == 429 for r in responses)

def test_access_control(client):
    """Test access control mechanisms."""
    owner = UserFactory()
    other_user = UserFactory()
    universe = UniverseFactory(user=owner, is_public=False)

    owner_headers = {
        'Authorization': f'Bearer {owner.generate_auth_token()}'
    }
    other_headers = {
        'Authorization': f'Bearer {other_user.generate_auth_token()}'
    }

    # Owner should have access
    owner_response = client.get(f'/api/universes/{universe.id}',
        headers=owner_headers
    )
    assert owner_response.status_code == 200

    # Other user should not have access
    other_response = client.get(f'/api/universes/{universe.id}',
        headers=other_headers
    )
    assert other_response.status_code == 403

def test_sql_injection_prevention(client, auth_headers):
    """Test SQL injection prevention."""
    # Try SQL injection in query parameters
    injection_attempts = [
        "1 OR '1'='1'",
        "1; DROP TABLE users;",
        "1 UNION SELECT * FROM users",
        "1' OR '1'='1",
    ]

    for attempt in injection_attempts:
        response = client.get(f'/api/universes/{attempt}',
            headers=auth_headers
        )
        assert response.status_code in [404, 400]  # Should not expose data or execute injection

def test_xss_prevention(client, auth_headers):
    """Test Cross-Site Scripting (XSS) prevention."""
    xss_payload = "<script>alert('xss')</script>"

    # Try XSS in universe name
    response = client.post('/api/universes',
        json={
            'name': xss_payload,
            'description': 'Test universe'
        },
        headers=auth_headers
    )
    assert response.status_code == 201

    # Verify response is escaped
    get_response = client.get(f'/api/universes/{response.json["id"]}',
        headers=auth_headers
    )
    assert xss_payload not in get_response.json['name']

def test_csrf_protection(client, auth_headers):
    """Test CSRF protection."""
    # Try request without CSRF token
    headers = auth_headers.copy()
    headers['X-CSRF-Token'] = 'invalid-token'

    response = client.post('/api/universes',
        json={'name': 'Test Universe'},
        headers=headers
    )
    assert response.status_code == 403

def test_secure_headers(client):
    """Test security headers."""
    response = client.get('/')
    headers = response.headers

    # Check security headers
    assert headers.get('X-Frame-Options') == 'DENY'
    assert headers.get('X-Content-Type-Options') == 'nosniff'
    assert headers.get('X-XSS-Protection') == '1; mode=block'
    assert 'Content-Security-Policy' in headers

def test_session_security(client):
    """Test session security features."""
    # Login to create session
    user = UserFactory()
    response = client.post('/api/auth/login',
        json={
            'email': user.email,
            'password': 'password123'
        }
    )
    assert response.status_code == 200

    # Check session cookie
    session_cookie = next(
        (cookie for cookie in client.cookie_jar if cookie.name == 'session'),
        None
    )
    assert session_cookie is not None
    assert session_cookie.secure  # Should be secure only
    assert session_cookie.http_only  # Should be HTTP only

def test_file_upload_security(client, auth_headers):
    """Test file upload security."""
    # Try uploading file with malicious extension
    with open('test.py', 'w') as f:
        f.write('print("malicious code")')

    with open('test.py', 'rb') as f:
        response = client.post('/api/media/upload',
            data={'file': (f, 'malicious.php')},
            headers=auth_headers
        )
        assert response.status_code == 400  # Should reject dangerous file types

    # Try uploading oversized file
    large_data = b'0' * (10 * 1024 * 1024)  # 10MB
    response = client.post('/api/media/upload',
        data={'file': ('large.txt', large_data)},
        headers=auth_headers
    )
    assert response.status_code == 400  # Should reject oversized files

def test_api_security(client, auth_headers):
    """Test API security measures."""
    # Test HTTP methods
    endpoints = [
        '/api/universes',
        '/api/users',
        '/api/storyboards'
    ]

    for endpoint in endpoints:
        # OPTIONS should be allowed for CORS
        options_response = client.options(endpoint)
        assert options_response.status_code == 200

        # TRACE should be disabled
        trace_response = client.trace(endpoint)
        assert trace_response.status_code == 405

        # PUT/DELETE should require authentication
        put_response = client.put(endpoint)
        delete_response = client.delete(endpoint)
        assert put_response.status_code == 401
        assert delete_response.status_code == 401
