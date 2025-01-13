import pytest
from app import create_app, db
from app.models.user import User
from app.config import TestConfig
import os

@pytest.fixture
def app():
    app = create_app(TestConfig)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

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
    return {
        'username': user.username,
        'email': user.email,
        'password': 'testpass123'
    }

@pytest.fixture
def auth_headers(client, test_user):
    response = client.post('/api/auth/login', json={
        'email': test_user['email'],
        'password': test_user['password']
    })
    token = response.json['token']
    return {'Authorization': f'Bearer {token}'}
