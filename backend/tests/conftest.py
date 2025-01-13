import pytest
from app import create_app, db
from app.models.user import User

@pytest.fixture
def app():
    app = create_app('testing')
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

@pytest.fixture
def test_user(app):
    user = User(
        username='testuser',
        email='test@example.com'
    )
    user.set_password('testpass123')
    with app.app_context():
        db.session.add(user)
        db.session.commit()
    return user

@pytest.fixture
def auth_headers(client, test_user):
    response = client.post('/auth/login', json={
        'email': test_user.email,
        'password': 'testpass123'
    })
    token = response.json['token']
    return {'Authorization': f'Bearer {token}'}
