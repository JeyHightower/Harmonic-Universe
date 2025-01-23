import pytest
from flask_jwt_extended import create_access_token
from app import create_app, db
from app.models.user import User
from .config import TestConfig

@pytest.fixture(scope='session')
def app():
    """Create application for the tests."""
    app = create_app(TestConfig)

    # Setup app context
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope='function')
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture(scope='function')
def test_user(app):
    """Create test user."""
    with app.app_context():
        user = User(
            username='testuser',
            email='test@example.com'
        )
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()
        yield user
        db.session.delete(user)
        db.session.commit()

@pytest.fixture(scope='function')
def auth_headers(app, test_user):
    """Create authentication headers."""
    with app.app_context():
        user_id = str(test_user.id)
        print(f"Creating token with user_id: {user_id} (type: {type(user_id)})")
        access_token = create_access_token(identity=user_id)
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        print(f"Generated headers: {headers}")
        return headers

@pytest.fixture(scope='function')
def websocket_manager(app):
    """Create WebSocket manager."""
    from app.sockets import WebSocketManager
    manager = WebSocketManager()
    app.websocket_manager = manager
    return manager
