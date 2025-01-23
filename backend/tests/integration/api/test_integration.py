import pytest
from app.models.base import Universe, PhysicsParameters, MusicParameters
from app.extensions import db

def test_universe_creation_with_parameters(client, auth_headers, session):
    """Test creating a universe with both physics and music parameters."""
    data = {
        'title': 'Integration Test Universe',
        'description': 'Testing full universe creation',
        'visibility': 'public',
        'physics_params': {
            'gravity': 9.81,
            'friction': 0.5,
            'elasticity': 0.7
        },
        'music_params': {
            'key': 'C',
            'scale': 'major',
            'tempo': 120
        }
    }

    response = client.post('/api/universes', json=data, headers=auth_headers)
    assert response.status_code == 201

    # Verify all parameters were saved correctly
    universe_id = response.json['id']
    universe = session.query(Universe).get(universe_id)

    assert universe.physics_parameters.gravity == 9.81
    assert universe.physics_parameters.friction == 0.5
    assert universe.physics_parameters.elasticity == 0.7

    assert universe.music_parameters.key == 'C'
    assert universe.music_parameters.scale == 'major'
    assert universe.music_parameters.tempo == 120

def test_parameter_interaction(client, auth_headers, session):
    """Test interaction between physics and music parameters."""
    # Create universe with initial parameters
    universe = Universe(
        title='Parameter Interaction Test',
        description='Testing parameter interactions',
        user_id=1,
        visibility='public'
    )
    physics_params = PhysicsParameters(
        gravity=9.81,
        friction=0.5,
        elasticity=0.7
    )
    music_params = MusicParameters(
        key='C',
        scale='major',
        tempo=120
    )
    universe.physics_parameters = physics_params
    universe.music_parameters = music_params
    session.add(universe)
    session.commit()

    # Update both parameters simultaneously
    update_data = {
        'physics_params': {
            'gravity': 5.0,
            'friction': 0.3
        },
        'music_params': {
            'key': 'G',
            'tempo': 140
        }
    }

    response = client.put(
        f'/api/universes/{universe.id}/parameters',
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 200

    # Verify both sets of parameters were updated
    universe = session.query(Universe).get(universe.id)
    assert universe.physics_parameters.gravity == 5.0
    assert universe.physics_parameters.friction == 0.3
    assert universe.music_parameters.key == 'G'
    assert universe.music_parameters.tempo == 140

def test_parameter_persistence_across_updates(client, auth_headers, session):
    """Test parameter persistence across multiple updates."""
    # Create universe with initial parameters
    universe = Universe(
        title='Persistence Test',
        description='Testing parameter persistence',
        user_id=1,
        visibility='public'
    )
    physics_params = PhysicsParameters(
        gravity=9.81,
        friction=0.5,
        elasticity=0.7
    )
    music_params = MusicParameters(
        key='C',
        scale='major',
        tempo=120
    )
    universe.physics_parameters = physics_params
    universe.music_parameters = music_params
    session.add(universe)
    session.commit()

    # Perform multiple updates
    updates = [
        {
            'physics_params': {'gravity': 5.0},
            'music_params': {'key': 'G'}
        },
        {
            'physics_params': {'friction': 0.3},
            'music_params': {'tempo': 140}
        },
        {
            'physics_params': {'elasticity': 0.9},
            'music_params': {'scale': 'minor'}
        }
    ]

    for update in updates:
        response = client.put(
            f'/api/universes/{universe.id}/parameters',
            json=update,
            headers=auth_headers
        )
        assert response.status_code == 200

    # Verify final state
    universe = session.query(Universe).get(universe.id)
    assert universe.physics_parameters.gravity == 5.0
    assert universe.physics_parameters.friction == 0.3
    assert universe.physics_parameters.elasticity == 0.9
    assert universe.music_parameters.key == 'G'
    assert universe.music_parameters.scale == 'minor'
    assert universe.music_parameters.tempo == 140

def test_error_propagation(client, auth_headers, session):
    """Test error handling and propagation across components."""
    # Create universe
    universe = Universe(
        title='Error Test',
        description='Testing error handling',
        user_id=1,
        visibility='public'
    )
    session.add(universe)
    session.commit()

    # Test invalid physics parameters
    invalid_physics = {
        'physics_params': {
            'gravity': -1.0,  # Invalid
            'friction': 0.5
        },
        'music_params': {
            'key': 'C',  # Valid
            'tempo': 120  # Valid
        }
    }

    response = client.put(
        f'/api/universes/{universe.id}/parameters',
        json=invalid_physics,
        headers=auth_headers
    )
    assert response.status_code == 400
    assert 'physics_params' in response.json['errors']

    # Test invalid music parameters
    invalid_music = {
        'physics_params': {
            'gravity': 9.81,  # Valid
            'friction': 0.5   # Valid
        },
        'music_params': {
            'key': 'H',    # Invalid
            'tempo': 120   # Valid
        }
    }

    response = client.put(
        f'/api/universes/{universe.id}/parameters',
        json=invalid_music,
        headers=auth_headers
    )
    assert response.status_code == 400
    assert 'music_params' in response.json['errors']
