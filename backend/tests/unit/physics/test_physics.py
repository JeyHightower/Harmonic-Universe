import pytest
from app.models.base import Universe, PhysicsParameters

def test_physics_parameter_validation(client, auth_headers, session):
    """Test physics parameter validation."""
    # Test invalid gravity
    data = {
        'gravity': -1.0,  # Invalid negative gravity
        'friction': 0.5,
        'elasticity': 0.7
    }

    response = client.post('/api/physics/parameters', json=data, headers=auth_headers)
    assert response.status_code == 400
    assert 'gravity' in response.json['errors']

    # Test invalid friction
    data = {
        'gravity': 9.81,
        'friction': 1.5,  # Invalid friction > 1
        'elasticity': 0.7
    }

    response = client.post('/api/physics/parameters', json=data, headers=auth_headers)
    assert response.status_code == 400
    assert 'friction' in response.json['errors']

def test_physics_parameter_update(client, auth_headers, session):
    """Test updating physics parameters."""
    # Create test universe with physics parameters
    universe = Universe(
        title='Physics Test Universe',
        description='Testing physics parameters',
        user_id=1,
        visibility='public'
    )
    physics_params = PhysicsParameters(
        gravity=9.81,
        friction=0.5,
        elasticity=0.7
    )
    universe.physics_parameters = physics_params
    session.add(universe)
    session.commit()

    # Update parameters
    update_data = {
        'gravity': 5.0,
        'friction': 0.3,
        'elasticity': 0.9
    }

    response = client.put(
        f'/api/universes/{universe.id}/physics',
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json['gravity'] == 5.0
    assert response.json['friction'] == 0.3
    assert response.json['elasticity'] == 0.9

def test_physics_parameter_ranges(client, auth_headers):
    """Test physics parameter range validation."""
    test_cases = [
        {
            'params': {'gravity': 21.0},  # Above max gravity
            'should_fail': True
        },
        {
            'params': {'friction': -0.1},  # Below min friction
            'should_fail': True
        },
        {
            'params': {'elasticity': 1.1},  # Above max elasticity
            'should_fail': True
        },
        {
            'params': {  # Valid parameters
                'gravity': 9.81,
                'friction': 0.5,
                'elasticity': 0.7
            },
            'should_fail': False
        }
    ]

    for case in test_cases:
        response = client.post(
            '/api/physics/parameters',
            json=case['params'],
            headers=auth_headers
        )
        if case['should_fail']:
            assert response.status_code == 400
        else:
            assert response.status_code == 201

def test_physics_parameter_persistence(client, auth_headers, session):
    """Test physics parameter persistence across sessions."""
    # Create universe with physics parameters
    universe = Universe(
        title='Persistence Test Universe',
        description='Testing physics parameter persistence',
        user_id=1,
        visibility='public'
    )
    physics_params = PhysicsParameters(
        gravity=9.81,
        friction=0.5,
        elasticity=0.7
    )
    universe.physics_parameters = physics_params
    session.add(universe)
    session.commit()

    # Verify parameters persist after session refresh
    session.expire_all()
    universe_reloaded = session.query(Universe).get(universe.id)
    assert universe_reloaded.physics_parameters.gravity == 9.81
    assert universe_reloaded.physics_parameters.friction == 0.5
    assert universe_reloaded.physics_parameters.elasticity == 0.7
