from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.main import app
from app.db.session import get_db
from app.models.user import User
from app.models.universe import Universe
from app.models.scene import Scene

def test_app_exists():
    """Test that the FastAPI application exists."""
    assert isinstance(app, FastAPI)

def test_app_configuration():
    """Test that the application is configured correctly."""
    assert app.title == "Harmonic Universe API"
    assert app.version == "1.0.0"
    assert app.debug is False  # Should be False in production

def test_database_connection(db_session: Session):
    """Test database connection."""
    result = db_session.execute(text("SELECT 1"))
    assert result.scalar() == 1

def test_create_user(db_session: Session):
    """Test user model creation."""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password="hashed_password",
        full_name="Test User",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.username == "testuser"
    assert user.full_name == "Test User"
    assert user.is_active is True

def test_create_universe(db_session: Session, test_user: User):
    """Test universe model creation."""
    universe = Universe(
        name="Test Universe",
        description="Test Description",
        creator_id=test_user.id
    )
    db_session.add(universe)
    db_session.commit()
    db_session.refresh(universe)

    assert universe.id is not None
    assert universe.name == "Test Universe"
    assert universe.description == "Test Description"
    assert universe.creator_id == test_user.id

def test_create_scene(db_session: Session, test_universe: Universe, test_user: User):
    """Test scene model creation."""
    scene = Scene(
        name="Test Scene",
        description="Test Description",
        universe_id=test_universe.id,
        creator_id=test_user.id,
        physics_parameters={},
        music_parameters={},
        rendering_mode="solid"
    )
    db_session.add(scene)
    db_session.commit()
    db_session.refresh(scene)

    assert scene.id is not None
    assert scene.name == "Test Scene"
    assert scene.description == "Test Description"
    assert scene.universe_id == test_universe.id
    assert scene.creator_id == test_user.id

def test_dependency_injection():
    """Test dependency injection setup."""
    assert get_db is not None
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200

def test_cors_configuration():
    """Test CORS configuration."""
    with TestClient(app) as client:
        response = client.options("/api/health", headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        })
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers

def test_error_handling():
    """Test error handling middleware."""
    with TestClient(app) as client:
        response = client.get("/api/nonexistent")
        assert response.status_code == 404
        assert "detail" in response.json()

def test_authentication_required():
    """Test authentication middleware."""
    with TestClient(app) as client:
        response = client.get("/api/users/me")
        assert response.status_code == 401
        assert "detail" in response.json()
