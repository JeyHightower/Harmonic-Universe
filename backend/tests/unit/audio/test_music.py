import pytest
from app.models.base import Universe, MusicParameters

def test_music_parameter_validation(client, auth_headers, session):
    """Test music parameter validation."""
    # Test invalid key
    data = {
        'key': 'H',  # Invalid musical key
        'scale': 'major',
        'tempo': 120
    }

    response = client.post('/api/music/parameters', json=data, headers=auth_headers)
    assert response.status_code == 400
    assert 'key' in response.json['errors']

    # Test invalid scale
    data = {
        'key': 'C',
        'scale': 'invalid_scale',  # Invalid scale type
        'tempo': 120
    }

    response = client.post('/api/music/parameters', json=data, headers=auth_headers)
    assert response.status_code == 400
    assert 'scale' in response.json['errors']

def test_music_parameter_update(client, auth_headers, session):
    """Test updating music parameters."""
    # Create test universe with music parameters
    universe = Universe(
        title='Music Test Universe',
        description='Testing music parameters',
        user_id=1,
        visibility='public'
    )
    music_params = MusicParameters(
        key='C',
        scale='major',
        tempo=120
    )
    universe.music_parameters = music_params
    session.add(universe)
    session.commit()

    # Update parameters
    update_data = {
        'key': 'G',
        'scale': 'minor',
        'tempo': 140
    }

    response = client.put(
        f'/api/universes/{universe.id}/music',
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json['key'] == 'G'
    assert response.json['scale'] == 'minor'
    assert response.json['tempo'] == 140

def test_music_parameter_ranges(client, auth_headers):
    """Test music parameter range validation."""
    test_cases = [
        {
            'params': {'tempo': 250},  # Above max tempo
            'should_fail': True
        },
        {
            'params': {'tempo': 30},  # Below min tempo
            'should_fail': True
        },
        {
            'params': {  # Valid parameters
                'key': 'C',
                'scale': 'major',
                'tempo': 120
            },
            'should_fail': False
        }
    ]

    for case in test_cases:
        response = client.post(
            '/api/music/parameters',
            json=case['params'],
            headers=auth_headers
        )
        if case['should_fail']:
            assert response.status_code == 400
        else:
            assert response.status_code == 201

def test_music_parameter_persistence(client, auth_headers, session):
    """Test music parameter persistence across sessions."""
    # Create universe with music parameters
    universe = Universe(
        title='Persistence Test Universe',
        description='Testing music parameter persistence',
        user_id=1,
        visibility='public'
    )
    music_params = MusicParameters(
        key='C',
        scale='major',
        tempo=120
    )
    universe.music_parameters = music_params
    session.add(universe)
    session.commit()

    # Verify parameters persist after session refresh
    session.expire_all()
    universe_reloaded = session.query(Universe).get(universe.id)
    assert universe_reloaded.music_parameters.key == 'C'
    assert universe_reloaded.music_parameters.scale == 'major'
    assert universe_reloaded.music_parameters.tempo == 120

def test_valid_musical_keys(client, auth_headers):
    """Test validation of musical keys."""
    valid_keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#',
                 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']

    for key in valid_keys:
        data = {
            'key': key,
            'scale': 'major',
            'tempo': 120
        }
        response = client.post('/api/music/parameters', json=data, headers=auth_headers)
        assert response.status_code == 201
        assert response.json['key'] == key

def test_valid_scales(client, auth_headers):
    """Test validation of musical scales."""
    valid_scales = ['major', 'minor', 'harmonic_minor', 'melodic_minor',
                   'pentatonic', 'blues']

    for scale in valid_scales:
        data = {
            'key': 'C',
            'scale': scale,
            'tempo': 120
        }
        response = client.post('/api/music/parameters', json=data, headers=auth_headers)
        assert response.status_code == 201
        assert response.json['scale'] == scale
