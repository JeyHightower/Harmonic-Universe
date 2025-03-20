import pytest
from backend.app import create_app
from backend.app.models import db, User


@pytest.fixture
def app():
    """Create application for the tests."""
    app = create_app("testing")
    return app


@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()


@pytest.fixture
def init_database():
    """Initialize test database."""
    db.create_all()
    yield db
    db.drop_all()


def test_user_registration(client, init_database):
    """Test user registration endpoint."""
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 201
    assert response.json["message"] == "User registered successfully"


def test_user_login(client, init_database):
    """Test user login endpoint."""
    # Create a user first
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()

    # Try to login
    response = client.post(
        "/api/auth/login", json={"username": "testuser", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json


def test_protected_route(client, init_database):
    """Test protected route access."""
    # Create and login user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()

    # Login to get token
    login_response = client.post(
        "/api/auth/login", json={"username": "testuser", "password": "password123"}
    )
    token = login_response.json["access_token"]

    # Try accessing protected route
    response = client.get(
        "/api/user/profile", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json["username"] == "testuser"
