import os
import tempfile
import pytest
from app import create_app, db

@pytest.fixture
def app():
    """Create application for the tests."""
    _app = create_app('testing')

    with _app.app_context():
        db.create_all()
        yield _app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create test CLI runner."""
    return app.test_cli_runner()

@pytest.fixture
def processor():
    """Create AudioProcessor instance."""
    from app.services.audio_processor import AudioProcessor
    return AudioProcessor()
