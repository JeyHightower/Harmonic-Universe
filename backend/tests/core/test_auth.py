"""Test authentication functionality."""

import pytest
from datetime import timedelta
from jose import jwt
from fastapi import HTTPException
from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    decode_access_token
)
from app.core.config.settings import Settings

def test_password_hashing():
    """Test password hashing and verification."""
    password = "test_password123"
    hashed = get_password_hash(password)

    # Test that hashed password is different from original
    assert hashed != password

    # Test that password verification works
    assert verify_password(password, hashed)

    # Test that wrong password fails verification
    assert not verify_password("wrong_password", hashed)

def test_access_token_creation():
    """Test JWT access token creation."""
    settings = Settings()
    user_id = 123

    # Create token with default expiry
    token = create_access_token(user_id)
    assert token is not None

    # Decode and verify token
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert decoded["sub"] == str(user_id)
    assert "exp" in decoded

    # Test custom expiry
    custom_expires = timedelta(minutes=15)
    token = create_access_token(user_id, expires_delta=custom_expires)
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert decoded["sub"] == str(user_id)

def test_token_expiry():
    """Test token expiration handling."""
    user_id = 123

    # Create token that expires immediately
    token = create_access_token(user_id, expires_delta=timedelta(microseconds=1))

    # Wait for token to expire
    import time
    time.sleep(0.1)

    # Verify token is expired
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    assert exc_info.value.status_code == 401
    assert "Token has expired" in str(exc_info.value.detail)

def test_invalid_token():
    """Test handling of invalid tokens."""
    # Test with malformed token
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token("invalid_token")
    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in str(exc_info.value.detail)

    # Test with token signed with wrong key
    wrong_token = jwt.encode(
        {"sub": "123", "exp": 2000000000},
        "wrong_secret_key",
        algorithm="HS256"
    )
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(wrong_token)
    assert exc_info.value.status_code == 401

def test_token_data():
    """Test token payload data."""
    user_id = 123
    token = create_access_token(user_id)

    # Verify token contains correct data
    settings = Settings()
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])

    assert decoded["sub"] == str(user_id)
    assert isinstance(decoded["exp"], int)
    assert decoded["exp"] > 0
