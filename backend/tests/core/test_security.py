"""Security functionality tests."""

import pytest
from datetime import timedelta
from jose import jwt, JWTError
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    decode_access_token,
    get_current_user,
    authenticate_user
)
from app.core.config import settings
from app.models.core.user import User

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

    # Test that empty password fails
    assert not verify_password("", hashed)

def test_access_token_creation():
    """Test JWT access token creation."""
    user_id = 123

    # Test token creation with default expiry
    token = create_access_token(user_id)
    assert token is not None

    # Decode and verify token
    decoded = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM]
    )
    assert decoded["sub"] == str(user_id)
    assert "exp" in decoded

    # Test custom expiry
    custom_expires = timedelta(minutes=15)
    token = create_access_token(user_id, expires_delta=custom_expires)
    decoded = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM]
    )
    assert decoded["sub"] == str(user_id)

def test_token_expiry():
    """Test token expiration handling."""
    user_id = 123

    # Create token that expires immediately
    token = create_access_token(
        user_id,
        expires_delta=timedelta(microseconds=1)
    )

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

@pytest.mark.asyncio
async def test_authenticate_user(db: AsyncSession, test_user: Dict[str, Any]):
    """Test user authentication."""
    # Test valid credentials
    user = await authenticate_user(
        db,
        test_user["email"],
        test_user["password"]
    )
    assert user is not None
    assert user.email == test_user["email"]

    # Test invalid email
    user = await authenticate_user(
        db,
        "wrong@email.com",
        test_user["password"]
    )
    assert user is None

    # Test invalid password
    user = await authenticate_user(
        db,
        test_user["email"],
        "wrong_password"
    )
    assert user is None

@pytest.mark.asyncio
async def test_get_current_user(db: AsyncSession, test_user: Dict[str, Any]):
    """Test getting current user from token."""
    # Create valid token
    token = create_access_token(test_user["user"].id)

    # Get user from token
    user = await get_current_user(db, token)
    assert user is not None
    assert user.id == test_user["user"].id
    assert user.email == test_user["email"]

    # Test with invalid token
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(db, "invalid_token")
    assert exc_info.value.status_code == 401

@pytest.mark.asyncio
async def test_superuser_permissions(db: AsyncSession):
    """Test superuser permission checks."""
    # Create superuser
    superuser = User(
        email="admin@example.com",
        hashed_password=get_password_hash("admin123"),
        is_superuser=True
    )
    db.add(superuser)
    await db.commit()
    await db.refresh(superuser)

    # Create normal user
    normal_user = User(
        email="user@example.com",
        hashed_password=get_password_hash("user123"),
        is_superuser=False
    )
    db.add(normal_user)
    await db.commit()
    await db.refresh(normal_user)

    # Test superuser permissions
    assert superuser.is_superuser
    assert not normal_user.is_superuser

def test_rate_limiting():
    """Test rate limiting functionality."""
    from app.core.security import RateLimiter

    # Create rate limiter (10 requests per minute)
    limiter = RateLimiter(10, 60)

    # Test within limit
    for _ in range(10):
        assert limiter.is_allowed("test_user")

    # Test exceeding limit
    assert not limiter.is_allowed("test_user")

    # Test different users
    assert limiter.is_allowed("other_user")
