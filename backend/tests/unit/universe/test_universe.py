import pytest
from flask import url_for
from app.models import Universe, PhysicsParameters, MusicParameters, VisualizationParameters, User
from app.extensions import db
from app.schemas import UniverseSchema
from flask_jwt_extended import create_access_token

@pytest.fixture
def test_universe(test_user, session):
    """Create a test universe with parameters."""
    # Ensure test_user exists in the session
    session.add(test_user)
    session.flush()  # Get the ID without committing

    universe = Universe(
        name='Test Universe',
        description='Test Description',
        is_public=True,
        user_id=test_user.id
    )

    physics = PhysicsParameters(
        gravity=9.81,
        friction=0.5,
        elasticity=0.7
    )

    music = MusicParameters(
        key='C',
        scale='major',
        tempo=120
    )

    vis = VisualizationParameters(
        background_color='#000000',
        particle_color='#FFFFFF',
        glow_color='#00FF00',
        particle_count=1000,
        particle_size=2.0,
        particle_speed=1.0,
        glow_intensity=0.5,
        blur_amount=0.0,
        trail_length=0.5,
        animation_speed=1.0,
        bounce_factor=0.8,
        rotation_speed=0.0,
        camera_zoom=1.0,
        camera_rotation=0.0
    )

    universe.physics_parameters = physics
    universe.music_parameters = music
    universe.visualization_parameters = vis

    session.add(universe)
    session.commit()
    return universe

class TestUniverseAPI:
    def test_create_universe(self, client, auth_headers, session):
        """Test creating a new universe."""
        data = {
            'name': 'New Universe',
            'description': 'A test universe',
            'is_public': True,
            'physics_parameters': {
                'gravity': 9.81,
                'friction': 0.5,
                'elasticity': 0.7
            },
            'music_parameters': {
                'key': 'C',
                'scale': 'major',
                'tempo': 120
            },
            'visualization_parameters': {
                'background_color': '#000000',
                'particle_color': '#FFFFFF',
                'glow_color': '#00FF00',
                'particle_count': 1000,
                'particle_size': 2.0,
                'particle_speed': 1.0,
                'glow_intensity': 0.5,
                'blur_amount': 0.0,
                'trail_length': 0.5,
                'animation_speed': 1.0,
                'bounce_factor': 0.8,
                'rotation_speed': 0.0,
                'camera_zoom': 1.0,
                'camera_rotation': 0.0
            }
        }

        response = client.post('/api/universes', json=data, headers=auth_headers)
        assert response.status_code == 201
        assert response.json['name'] == 'New Universe'
        assert 'visualization_parameters' in response.json

    def test_get_universe(self, client, auth_headers, test_universe):
        """Test getting a universe."""
        response = client.get(f'/api/universes/{test_universe.id}', headers=auth_headers)
        assert response.status_code == 200
        assert response.json['name'] == 'Test Universe'

    def test_update_universe(self, client, auth_headers, test_universe):
        """Test updating a universe."""
        data = {
            'name': 'Updated Universe',
            'description': 'Updated description',
            'is_public': True
        }
        response = client.put(
            f'/api/universes/{test_universe.id}',
            json=data,
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json['name'] == 'Updated Universe'

    def test_delete_universe(self, client, auth_headers, test_universe):
        """Test deleting a universe."""
        response = client.delete(
            f'/api/universes/{test_universe.id}',
            headers=auth_headers
        )
        assert response.status_code == 204

    def test_list_universes(self, client, auth_headers, test_universe):
        """Test listing universes."""
        response = client.get('/api/universes', headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json) > 0

    def test_invalid_universe_creation(self, client, auth_headers):
        """Test creating a universe with invalid data."""
        data = {
            'name': '',
            'description': 'Test description',
            'is_public': 'invalid'
        }
        response = client.post('/api/universes', json=data, headers=auth_headers)
        assert response.status_code == 400

class TestParameterIntegration:
    def test_physics_music_integration(self, client, auth_headers, test_universe):
        data = {
            'physics_parameters': {
                'gravity': 15.0,
                'friction': 0.8
            }
        }

        response = client.patch(
            f'/api/universes/{test_universe.id}/parameters',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json['physics_parameters']['gravity'] == 15.0
        assert response.json['physics_parameters']['friction'] == 0.8

    def test_music_parameter_update(self, client, auth_headers, test_universe):
        data = {
            'music_parameters': {
                'tempo': 180,
                'key': 'G'
            }
        }

        response = client.patch(
            f'/api/universes/{test_universe.id}/parameters',
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json['music_parameters']['tempo'] == 180
        assert response.json['music_parameters']['key'] == 'G'

class TestValidation:
    def test_invalid_physics_parameters(self, client, auth_headers):
        data = {
            'name': 'Invalid Universe',
            'physics_parameters': {
                'gravity': -1.0
            }
        }

        response = client.post(
            url_for('universe.create_universe'),
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400
        assert 'gravity' in response.json['errors']

    def test_invalid_music_parameters(self, client, auth_headers):
        data = {
            'name': 'Invalid Universe',
            'music_parameters': {
                'tempo': 300
            }
        }

        response = client.post(
            url_for('universe.create_universe'),
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400
        assert 'tempo' in response.json['errors']

    def test_invalid_visualization_parameters(self, client, auth_headers):
        data = {
            'name': 'Invalid Universe',
            'visualization_parameters': {
                'particle_size': -1.0,
                'glow_intensity': 2.0,
                'background_color': 'invalid'
            }
        }

        response = client.post(
            url_for('universe.create_universe'),
            json=data,
            headers=auth_headers
        )

        assert response.status_code == 400
        assert 'particle_size' in response.json['errors']
        assert 'glow_intensity' in response.json['errors']
        assert 'background_color' in response.json['errors']

class TestAuthentication:
    def test_unauthorized_access(self, client, test_universe):
        response = client.get(
            url_for('universe.get_universe', universe_id=test_universe.id)
        )

        assert response.status_code == 401

    def test_wrong_user_access(self, client, auth_headers, test_universe, session):
        # Create another user
        other_user = User(
            username='other',
            email='other@example.com'
        )
        other_user.set_password('password123')
        session.add(other_user)
        session.commit()

        # Create auth headers for the other user
        other_token = create_access_token(identity=other_user.id)
        other_headers = {
            'Authorization': f'Bearer {other_token}',
            'Content-Type': 'application/json'
        }

        # Try to access first user's universe with other user's token
        response = client.delete(
            url_for('universe.delete_universe', universe_id=test_universe.id),
            headers=other_headers
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
