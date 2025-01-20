import os
import pytest
from app import create_app
from app.extensions import db as _db
from sqlalchemy.orm import scoped_session, sessionmaker
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import create_access_token

@pytest.fixture(scope='session')
def app():
    """Create application for the tests."""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    return app

@pytest.fixture(scope='session')
def db(app):
    """Create database for the tests."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.drop_all()

@pytest.fixture(scope='function')
def session(db):
    """Create a new database session for a test."""
    connection = db.engine.connect()
    transaction = connection.begin()

    # Create a session factory bound to the connection
    session_factory = sessionmaker(bind=connection)
    session = scoped_session(session_factory)

    # Start with a clean slate for each test
    db.session = session

    yield session

    # Cleanup
    session.close()
    transaction.rollback()
    connection.close()

    # Reset main session
    db.session = scoped_session(sessionmaker(bind=db.engine))

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create test CLI runner."""
    return app.test_cli_runner()

@pytest.fixture
def auth_headers(app):
    """Return auth headers for testing."""
    with app.app_context():
        token = create_access_token(identity=1)
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
