import pytest
from app.utils.security import (
    generate_csrf_token,
    validate_csrf_token,
    sanitize_input,
    validate_file_size
)
from flask import current_app
from io import BytesIO
from unittest.mock import Mock

def test_generate_csrf_token():
    """Test CSRF token generation"""
    token = generate_csrf_token()
    assert isinstance(token, str)
    assert len(token) == 64  # 32 bytes = 64 hex characters

def test_validate_csrf_token(app):
    """Test CSRF token validation"""
    with app.app_context():
        token = generate_csrf_token()
        current_app.config['CSRF_TOKEN'] = token

        # Valid token
        assert validate_csrf_token(token) is True

        # Invalid token
        assert validate_csrf_token('invalid_token') is False

        # Empty token
        assert validate_csrf_token('') is False
        assert validate_csrf_token(None) is False

def test_sanitize_input():
    """Test input sanitization"""
    # Test string sanitization
    assert sanitize_input('<script>alert("xss")</script>') == '&lt;script&gt;alert("xss")&lt;/script&gt;'

    # Test dict sanitization
    data = {
        'name': '<b>test</b>',
        'description': '<script>alert("xss")</script>'
    }
    sanitized = sanitize_input(data)
    assert sanitized['name'] == '&lt;b&gt;test&lt;/b&gt;'
    assert sanitized['description'] == '&lt;script&gt;alert("xss")&lt;/script&gt;'

    # Test list sanitization
    data = ['<b>test</b>', '<script>alert("xss")</script>']
    sanitized = sanitize_input(data)
    assert sanitized[0] == '&lt;b&gt;test&lt;/b&gt;'
    assert sanitized[1] == '&lt;script&gt;alert("xss")&lt;/script&gt;'

    # Test nested structures
    data = {
        'items': [
            {'name': '<b>test</b>'},
            {'description': '<script>alert("xss")</script>'}
        ]
    }
    sanitized = sanitize_input(data)
    assert sanitized['items'][0]['name'] == '&lt;b&gt;test&lt;/b&gt;'
    assert sanitized['items'][1]['description'] == '&lt;script&gt;alert("xss")&lt;/script&gt;'

def test_validate_file_size(app):
    """Test file size validation"""
    with app.app_context():
        # Create mock file under size limit
        small_file = Mock()
        small_file.content_length = 1024 * 1024  # 1MB
        assert validate_file_size(small_file, max_size_mb=5) is True

        # Create mock file over size limit
        large_file = Mock()
        large_file.content_length = 10 * 1024 * 1024  # 10MB
        with pytest.raises(Exception) as exc_info:
            validate_file_size(large_file, max_size_mb=5)
        assert "File size exceeds 5MB limit" in str(exc_info.value)
