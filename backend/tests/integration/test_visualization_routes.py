import pytest
import json
from flask import url_for
from app import create_app
from app.extensions import db
from app.models import User, Universe, VisualizationParameters

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def test_user(app):
    user = User(username='testuser', email='test@example.com')
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def auth_headers(client, test_user):
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    token = json.loads(response.data)['token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def test_universe(test_user):
    universe = Universe(
        title='Test Universe',
        description='Test Description',
        user_id=test_user.id,
        is_public=True
    )
    db.session.add(universe)
    db.session.commit()
    return universe

def test_create_visualization_settings(client, auth_headers, test_universe):
    """Test creating visualization settings for a universe."""
    settings_data = {
        'color_scheme': 'default',
        'particle_density': 1000,
        'particle_size': 2.0,
        'blur_amount': 0.5,
        'glow_intensity': 0.7
    }

    response = client.post(
        f'/api/visualization/settings/{test_universe.id}',
        json=settings_data,
        headers=auth_headers
    )
    assert response.status_code == 201

    data = json.loads(response.data)
    assert 'visualization' in data
    vis_settings = data['visualization']
    assert vis_settings['color_scheme'] == settings_data['color_scheme']
    assert vis_settings['particle_density'] == settings_data['particle_density']
    assert vis_settings['particle_size'] == settings_data['particle_size']
    assert vis_settings['blur_amount'] == settings_data['blur_amount']
    assert vis_settings['glow_intensity'] == settings_data['glow_intensity']

def test_get_visualization_settings(client, auth_headers, test_universe):
    """Test getting visualization settings for a universe."""
    # Create settings first
    settings = VisualizationParameters(
        universe_id=test_universe.id,
        color_scheme='default',
        particle_density=1000,
        particle_size=2.0,
        blur_amount=0.5,
        glow_intensity=0.7
    )
    with client.application.app_context():
        db.session.add(settings)
        db.session.commit()

    response = client.get(
        f'/api/visualization/settings/{test_universe.id}',
        headers=auth_headers
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert 'visualization' in data
    vis_settings = data['visualization']
    assert vis_settings['color_scheme'] == 'default'
    assert vis_settings['particle_density'] == 1000
    assert vis_settings['particle_size'] == 2.0
    assert vis_settings['blur_amount'] == 0.5
    assert vis_settings['glow_intensity'] == 0.7

def test_update_visualization_settings(client, auth_headers, test_universe):
    """Test updating visualization settings for a universe."""
    # Create initial settings
    settings = VisualizationParameters(
        universe_id=test_universe.id,
        color_scheme='default',
        particle_density=1000,
        particle_size=2.0,
        blur_amount=0.5,
        glow_intensity=0.7
    )
    with client.application.app_context():
        db.session.add(settings)
        db.session.commit()

    # Update settings
    update_data = {
        'color_scheme': 'dark',
        'particle_density': 1500,
        'particle_size': 2.5,
        'blur_amount': 0.7,
        'glow_intensity': 0.8
    }

    response = client.put(
        f'/api/visualization/settings/{test_universe.id}',
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert 'visualization' in data
    vis_settings = data['visualization']
    assert vis_settings['color_scheme'] == update_data['color_scheme']
    assert vis_settings['particle_density'] == update_data['particle_density']
    assert vis_settings['particle_size'] == update_data['particle_size']
    assert vis_settings['blur_amount'] == update_data['blur_amount']
    assert vis_settings['glow_intensity'] == update_data['glow_intensity']

def test_visualization_settings_validation(client, auth_headers, test_universe):
    """Test validation of visualization settings."""
    # Test invalid color scheme
    invalid_settings = {
        'color_scheme': 'invalid_scheme',
        'particle_density': 1000,
        'particle_size': 2.0,
        'blur_amount': 0.5,
        'glow_intensity': 0.7
    }
    response = client.post(
        f'/api/visualization/settings/{test_universe.id}',
        json=invalid_settings,
        headers=auth_headers
    )
    assert response.status_code == 400

    # Test invalid particle density
    invalid_settings = {
        'color_scheme': 'default',
        'particle_density': -100,  # Invalid negative value
        'particle_size': 2.0,
        'blur_amount': 0.5,
        'glow_intensity': 0.7
    }
    response = client.post(
        f'/api/visualization/settings/{test_universe.id}',
        json=invalid_settings,
        headers=auth_headers
    )
    assert response.status_code == 400

    # Test missing required fields
    invalid_settings = {
        'color_scheme': 'default',
        'particle_density': 1000
        # Missing other required fields
    }
    response = client.post(
        f'/api/visualization/settings/{test_universe.id}',
        json=invalid_settings,
        headers=auth_headers
    )
    assert response.status_code == 400

def test_visualization_settings_permissions(app, client, auth_headers, test_universe):
    """Test permissions for visualization settings."""
    # Create another user
    other_user = User(username='otheruser', email='other@example.com')
    other_user.set_password('password123')
    with app.app_context():
        db.session.add(other_user)
        db.session.commit()

        # Login as other user
        response = client.post('/api/auth/login', json={
            'email': 'other@example.com',
            'password': 'password123'
        })
        other_token = json.loads(response.data)['token']
        other_headers = {'Authorization': f'Bearer {other_token}'}

        # Try to create settings for another user's universe
        settings_data = {
            'color_scheme': 'default',
            'particle_density': 1000,
            'particle_size': 2.0,
            'blur_amount': 0.5,
            'glow_intensity': 0.7
        }
        response = client.post(
            f'/api/visualization/settings/{test_universe.id}',
            json=settings_data,
            headers=other_headers
        )
        assert response.status_code == 403

def test_render_visualization(client, auth_headers, test_universe):
    """Test rendering visualization for a universe."""
    # Create visualization settings
    settings = VisualizationParameters(
        universe_id=test_universe.id,
        color_scheme='default',
        particle_density=1000,
        particle_size=2.0,
        blur_amount=0.5,
        glow_intensity=0.7
    )
    with client.application.app_context():
        db.session.add(settings)
        db.session.commit()

    response = client.post(
        f'/api/visualization/render/{test_universe.id}',
        headers=auth_headers
    )
    assert response.status_code == 200

    data = json.loads(response.data)
    assert 'visualization_url' in data
    assert 'frame_count' in data
    assert 'format' in data
