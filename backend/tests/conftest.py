"""Test configuration and fixtures."""

import os
import sys
import pytest
from typing import Dict, Generator, AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, inspect
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from datetime import datetime, timedelta
import logging
from pathlib import Path
from jose import jwt
import asyncio
import contextlib
import platform
from fastapi import HTTPException, FastAPI
import alembic.config
import alembic.command
from flask import Flask
from flask.testing import FlaskClient

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the project root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.db.base import Base
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.core.test_config import TestSettings
from app.test_config import test_settings
from app.db.init_db import init_db, verify_database_connection

# Import models needed for fixtures
from app.models.user import User
from app.models.universe import Universe
from app.models import __all__ as model_names

# Import crud and schemas for superuser creation
from app import crud, schemas

# Test directories
TEST_UPLOAD_DIR = Path("tests/uploads")
TEST_FIXTURES_DIR = Path("tests/fixtures")

def create_test_engine():
    """Create and configure the test database engine."""
    logger.info("Creating test database engine")
    engine = create_engine(
        test_settings.SQLALCHEMY_DATABASE_URI,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
    )
    logger.info(f"Test engine created with URL: {test_settings.SQLALCHEMY_DATABASE_URI}")
    return engine

# Create test engine
engine = create_test_engine()

# Create test session factory
TestingSessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

def run_migrations():
    """Run database migrations."""
    logger.info("Running database migrations")
    try:
        alembic_cfg = alembic.config.Config(str(test_settings.ALEMBIC_INI_PATH))
        alembic_cfg.set_main_option("sqlalchemy.url", str(test_settings.SQLALCHEMY_DATABASE_URI))
        alembic.command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations completed successfully")
    except Exception as e:
        logger.error(f"Error running migrations: {e}")
        raise

def verify_tables_exist(engine):
    """Verify that all required tables exist in the database."""
    logger.info("Verifying database tables")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    required_tables = [table.__tablename__ for table in Base.__subclasses__()]

    missing_tables = set(required_tables) - set(existing_tables)
    if missing_tables:
        logger.error(f"Missing tables: {missing_tables}")
        raise RuntimeError(f"Missing required tables: {missing_tables}")

    logger.info("All required tables exist")

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Set up test database."""
    logger.info("Setting up test database")

    # Drop existing test database if it exists
    if test_settings.TEST_DB_PATH.exists():
        logger.info("Removing existing test database")
        test_settings.TEST_DB_PATH.unlink()

    # Create all tables
    logger.info("Creating database tables")
    Base.metadata.create_all(bind=engine)

    # Run migrations
    run_migrations()

    # Verify tables exist
    verify_tables_exist(engine)

    # Initialize test data
    db = TestingSessionLocal()
    try:
        logger.info("Initializing test data")
        init_db(db, is_test=True)
        verify_database_connection(db)
    except Exception as e:
        logger.error(f"Error initializing test data: {e}")
        raise
    finally:
        db.close()

    yield

    # Cleanup after all tests
    logger.info("Cleaning up test database")
    db = TestingSessionLocal()
    try:
        Base.metadata.drop_all(bind=engine)
    finally:
        db.close()

    if test_settings.TEST_DB_PATH.exists():
        test_settings.TEST_DB_PATH.unlink()

@pytest.fixture(scope="function")
def db_session() -> Generator:
    """Create a new database session for a test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture(scope="function", autouse=True)
def setup_test_files():
    """Set up test file directories."""
    TEST_UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
    TEST_FIXTURES_DIR.mkdir(exist_ok=True, parents=True)

    yield

    # Cleanup test files after each test
    if TEST_UPLOAD_DIR.exists():
        for file in TEST_UPLOAD_DIR.glob("*"):
            file.unlink()
    if TEST_FIXTURES_DIR.exists():
        for file in TEST_FIXTURES_DIR.glob("*"):
            file.unlink()

@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine."""
    return engine

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    if platform.system() == "Windows":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    else:
        asyncio.set_event_loop_policy(asyncio.DefaultEventLoopPolicy())
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

def get_test_db_url():
    """Get test database URL."""
    return test_settings.SQLALCHEMY_DATABASE_URI

@pytest.fixture
def auth_client(client, test_user) -> Generator:
    """Create an authenticated test client."""
    token = create_access_token(test_user.id)
    client.headers = {"Authorization": f"Bearer {token}"}
    yield client

@pytest.fixture
def superuser_client(client, test_superuser) -> Generator:
    """Create a superuser test client."""
    token = create_access_token(test_superuser.id)
    client.headers = {"Authorization": f"Bearer {token}"}
    yield client

@pytest.fixture
def client() -> Generator:
    """Create a test client for Flask."""
    with app.test_client() as test_client:
        yield test_client

@pytest.fixture
def test_user(db_session: Session) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        is_active=True,
        is_superuser=False,
        email_verified=True,
        hashed_password=get_password_hash("test-password")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_superuser(db_session: Session) -> User:
    """Create a test superuser."""
    user = User(
        email="admin@example.com",
        username="admin",
        full_name="Admin User",
        is_active=True,
        is_superuser=True,
        email_verified=True,
        hashed_password=get_password_hash("admin-password")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_universe(db_session: Session, test_user: User) -> Universe:
    """Create a test universe."""
    universe = Universe(
        name="Test Universe",
        description="A test universe",
        physics_json={},
        music_parameters={},
        creator_id=test_user.id
    )
    db_session.add(universe)
    db_session.commit()
    db_session.refresh(universe)
    return universe

@pytest.fixture
async def websocket_client(test_client):
    """Websocket test client."""
    async with test_client.websocket_connect("/ws") as websocket:
        yield websocket

@pytest.fixture
def auth_headers(test_user: User) -> Dict[str, str]:
    """Create authentication headers."""
    access_token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {access_token}"}
