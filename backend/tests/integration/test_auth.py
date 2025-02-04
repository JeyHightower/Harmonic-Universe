import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.models.core.user import User
from app.schemas.user import UserCreate
from datetime import timedelta
from fastapi import status

# Create test client
client = TestClient(app)

def test_signup(client):
    """Test user signup."""
    data = {
        "email": "newuser@example.com",
        "password": "testpassword123",
        "full_name": "New User"
    }
    response = client.post("/api/auth/signup", json=data)
    assert response.status_code == status.HTTP_201_CREATED
    content = response.json()
    assert content["email"] == data["email"]
    assert content["full_name"] == data["full_name"]
    assert "id" in content

def test_login(client, test_user):
    """Test user login."""
    data = {
        "username": test_user.email,
        "password": "testpassword"
    }
    response = client.post("/api/auth/login", data=data)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert "access_token" in content
    assert content["token_type"] == "bearer"

def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    data = {
        "username": "wrong@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/api/auth/login", data=data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_current_user(client, auth_headers, test_user):
    """Test getting current user info."""
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert content["email"] == test_user.email
    assert content["full_name"] == test_user.full_name

def test_update_user(client, auth_headers):
    """Test updating user info."""
    data = {
        "full_name": "Updated Name"
    }
    response = client.put("/api/auth/me", json=data, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert content["full_name"] == data["full_name"]

def test_signup_duplicate_email(client, test_user):
    """Test signup with existing email."""
    data = {
        "email": test_user.email,
        "password": "testpassword123",
        "full_name": "Another User"
    }
    response = client.post("/api/auth/signup", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_password_reset_request(client, test_user):
    """Test password reset request."""
    data = {
        "email": test_user.email
    }
    response = client.post("/api/auth/password-reset-request", json=data)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert "message" in content

def test_password_reset_invalid_token(client):
    """Test password reset with invalid token."""
    data = {
        "token": "invalid_token",
        "new_password": "newpassword123"
    }
    response = client.post("/api/auth/password-reset-confirm", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    content = response.json()
    assert "detail" in content

def test_login_incorrect_password(client, test_user):
    """Test login with incorrect password."""
    login_data = {
        "email": test_user.email,
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/login", json=login_data)
    content = response.json()
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect" in content["detail"]

def test_login_invalid_user(client):
    """Test login with non-existent user."""
    login_data = {
        "email": "nonexistent@example.com",
        "password": "password"
    }
    response = client.post("/api/v1/auth/login", json=login_data)
    content = response.json()
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "User not found" in content["detail"]

def test_register_user(client, session):
    """Test user registration."""
    user_data = {
        "email": "newuser@example.com",
        "password": "newpassword",
        "username": "newuser",
        "display_name": "New User",
        "bio": "A new user"
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    content = response.json()
    assert response.status_code == status.HTTP_201_CREATED
    assert content["email"] == user_data["email"]
    assert content["username"] == user_data["username"]
    assert "id" in content

    # Verify user in database
    db_user = session.query(User).filter(User.email == user_data["email"]).first()
    assert db_user is not None
    assert db_user.email == user_data["email"]

def test_register_existing_user(client, test_user):
    """Test registering with existing email."""
    user_data = {
        "email": test_user.email,
        "password": "password",
        "username": "anotheruser",
        "display_name": "Another User",
        "bio": "Another user"
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    content = response.json()
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Email already registered" in content["detail"]

def test_get_current_user_invalid_token(client):
    """Test getting user details with invalid token."""
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/api/v1/auth/me", headers=headers)
    content = response.json()
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Could not validate credentials" in content["detail"]

def test_refresh_token(client, auth_headers):
    """Test token refresh."""
    response = client.post("/api/auth/refresh", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert "access_token" in content
    assert content["token_type"] == "bearer"

def test_change_password(client, auth_headers):
    """Test password change."""
    data = {
        "current_password": "testpassword",
        "new_password": "newpassword123"
    }
    response = client.post("/api/auth/change-password", json=data, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert "message" in content

def test_reset_password_request(client, test_user):
    """Test password reset request."""
    data = {
        "email": test_user.email
    }
    response = client.post("/api/auth/password-reset-request", json=data)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert "message" in content

def test_reset_password_confirm(client, test_user):
    """Test password reset confirmation."""
    token = create_access_token(
        data={"sub": str(test_user.id)},
        expires_delta=timedelta(minutes=15)
    )
    data = {
        "token": token,
        "new_password": "resetpassword123"
    }
    response = client.post("/api/auth/password-reset-confirm", json=data)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert "message" in content

def test_reset_password_invalid_token(client):
    """Test password reset with invalid token."""
    data = {
        "token": "invalid_token",
        "new_password": "resetpassword123"
    }
    response = client.post("/api/auth/password-reset-confirm", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    content = response.json()
    assert "detail" in content

def test_verify_email(client, test_user):
    """Test email verification."""
    token = create_access_token(
        data={"sub": str(test_user.id)},
        expires_delta=timedelta(days=1)
    )
    response = client.get(f"/api/auth/verify-email/{token}")
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert "message" in content

def test_verify_email_invalid_token(client):
    """Test email verification with invalid token."""
    response = client.get("/api/auth/verify-email/invalid_token")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    content = response.json()
    assert "detail" in content

def test_logout(client, auth_headers):
    """Test user logout."""
    response = client.post("/api/auth/logout", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    content = response.json()
    assert "message" in content

def test_token_expiration(client):
    """Test token expiration."""
    expired_token = create_access_token(
        data={"sub": "test@example.com"},
        expires_delta=timedelta(minutes=-1)
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    content = response.json()
    assert "Token has expired" in content["detail"]
