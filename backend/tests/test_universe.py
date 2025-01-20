import pytest
from flask import url_for
from app.models import Universe, User, PhysicsParameters, MusicParameters, VisualizationParameters
from app.extensions import db

@pytest.fixture
def test_user(client):
    user = User(
        username='testuser',
        email='test@example.com'
    )
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def auth_headers(test_user, client):
    response = client.post(url_for('auth.login'), json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    token = response.json['token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def test_universe(test_user):
    universe = Universe(
        name='Test Universe',
        description='Test Description',
        is_public=True,
        user_id=test_user.id
    )

    physics = PhysicsParameters(
        gravity=9.81,
        friction=0.5,
        elasticity=0.7,
        air_resistance=0.1,
        density=1.0
    )

    music = MusicParameters(
        harmony=1.0,
        tempo=120,
        key='C',
        scale='major'
    )

    visualization = VisualizationParameters(
        brightness=0.8,
        saturation=0.7,
        complexity=0.5,
        color_scheme='rainbow'
    )

    universe.physics_parameters = physics
    universe.music_parameters = music
    universe.visualization_parameters = visualization

    db.session.add(universe)
    db.session.commit()
    return universe

class TestUniverseAPI:
    def test_create_universe(self, client, auth_headers):
        data = {
            'name': 'New Universe',
            'description': 'A new test universe',
            'is_public': True,
            'physics_parameters': {
                'gravity': 9.81,
                'friction': 0.5,
                'elasticity': 0.7,
                'airResistance': 0.1,
                'density': 1.0
            },
            'music_parameters': {
                'harmony': 1.0,
                'tempo': 120,
                'key': 'C',
                'scale': 'major'
            },
            'visualization_parameters': {
                'brightness': 0.8,
                'saturation': 0.7,
                'complexity': 0.5,
                'colorScheme': 'rainbow'
            }
        }

        response = client.post(
            url_for('universe.create_universe'),
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 201
        assert response.json['name'] == 'New Universe'
        assert 'id' in response.json
        assert 'visualization_parameters' in response.json

    def test_get_universe(self, client, auth_headers, test_universe):
        response = client.get(
            url_for('universe.get_universe', universe_id=test_universe.id),
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json['name'] == 'Test Universe'
        assert response.json['physics_parameters']['gravity'] == 9.81
        assert response.json['visualization_parameters']['brightness'] == 0.8

    def test_update_universe(self, client, auth_headers, test_universe):
        data = {
            'name': 'Updated Universe',
            'physics_parameters': {
                'gravity': 5.0
            },
            'visualization_parameters': {
                'brightness': 0.6
            }
        }

        response = client.put(
            url_for('universe.update_universe', universe_id=test_universe.id),
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json['name'] == 'Updated Universe'
        assert response.json['physics_parameters']['gravity'] == 5.0
        assert response.json['visualization_parameters']['brightness'] == 0.6

    def test_delete_universe(self, client, auth_headers, test_universe):
        response = client.delete(
            url_for('universe.delete_universe', universe_id=test_universe.id),
            headers=auth_headers
        )

        assert response.status_code == 204
        assert Universe.query.get(test_universe.id) is None

class TestParameterIntegration:
    def test_physics_music_integration(self, client, auth_headers, test_universe):
        data = {
            'gravity': 15.0,
            'friction': 0.8
        }

        response = client.patch(
            url_for('universe.update_physics', universe_id=test_universe.id),
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json['physics_parameters']['gravity'] == 15.0
        assert response.json['music_parameters']['harmony'] > 0
        assert response.json['visualization_parameters']['complexity'] > 0

    def test_music_visualization_integration(self, client, auth_headers, test_universe):
        data = {
            'tempo': 180,
            'harmony': 0.8
        }

        response = client.patch(
            url_for('universe.update_music', universe_id=test_universe.id),
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json['music_parameters']['tempo'] == 180
        assert response.json['visualization_parameters']['complexity'] > 0

    def test_visualization_update(self, client, auth_headers, test_universe):
        data = {
            'brightness': 0.9,
            'colorScheme': 'monochrome'
        }

        response = client.patch(
            url_for('universe.update_visualization', universe_id=test_universe.id),
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json['visualization_parameters']['brightness'] == 0.9
        assert response.json['visualization_parameters']['colorScheme'] == 'monochrome'

class TestValidation:
    def test_invalid_physics_parameters(self, client, auth_headers):
        data = {
            'name': 'Invalid Universe',
            'physics_parameters': {
                'gravity': -1.0  # Invalid negative gravity
            }
        }

        response = client.post(
            url_for('universe.create_universe'),
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400
        assert 'gravity' in response.json['message']

    def test_invalid_music_parameters(self, client, auth_headers):
        data = {
            'name': 'Invalid Universe',
            'music_parameters': {
                'tempo': 300  # Invalid tempo range
            }
        }

        response = client.post(
            url_for('universe.create_universe'),
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400
        assert 'tempo' in response.json['message']

    def test_invalid_visualization_parameters(self, client, auth_headers):
        data = {
            'name': 'Invalid Universe',
            'visualization_parameters': {
                'brightness': 1.5,  # Invalid brightness range
                'colorScheme': 'invalid'  # Invalid color scheme
            }
        }

        response = client.post(
            url_for('universe.create_universe'),
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400
        assert 'brightness' in response.json['message']
        assert 'colorScheme' in response.json['message']

class TestAuthentication:
    def test_unauthorized_access(self, client, test_universe):
        response = client.get(
            url_for('universe.get_universe', universe_id=test_universe.id)
        )

        assert response.status_code == 401

    def test_wrong_user_access(self, client, auth_headers, test_universe):
        # Create another user
        other_user = User(
            username='other',
            email='other@example.com'
        )
        other_user.set_password('password123')
        db.session.add(other_user)
        db.session.commit()

        # Try to access first user's universe
        response = client.delete(
            url_for('universe.delete_universe', universe_id=test_universe.id),
            headers=auth_headers
        )

        assert response.status_code == 403

class TestAIIntegration:
    def test_ai_parameter_suggestions(self, client, auth_headers, test_universe):
        data = {
            'target': 'physics',
            'constraints': {
                'min_gravity': 5.0,
                'max_tempo': 160
            }
        }

        response = client.post(
            url_for('universe.ai_suggest', universe_id=test_universe.id),
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 200
        assert 'suggestions' in response.json
        assert 'explanation' in response.json
        assert response.json['suggestions']['physics_parameters']['gravity'] >= 5.0
        assert response.json['suggestions']['music_parameters']['tempo'] <= 160
