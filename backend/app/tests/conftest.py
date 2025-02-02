import pytest
from typing import Dict, Generator
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal, engine, Base
from app.main import app
from app.tests.utils.user import create_random_user

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create tables in test database before running tests."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop all tables after tests
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="session")
def db() -> Generator:
    """Create a fresh database session for a test."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="module")
def client() -> Generator:
    """Create a test client for the FastAPI app."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient, db: Session) -> Dict[str, str]:
    """Return a valid token for the superuser."""
    superuser = create_random_user(db)
    auth_token = "test-superuser-token"  # In a real app, generate this properly
    return {"Authorization": f"Bearer {auth_token}"}

@pytest.fixture(autouse=True)
def setup_and_teardown(db: Session):
    """Perform any setup before each test and cleanup after."""
    # Start with a clean slate for each test
    db.begin_nested()
    yield
    # Cleanup: rollback any changes made during the test
    db.rollback()
    db.close()
