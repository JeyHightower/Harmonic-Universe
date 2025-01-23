import pytest
from app.models import MusicParameters, Universe
from app.extensions import db
from sqlalchemy.exc import IntegrityError

def test_music_parameter_creation(session):
    """Test creating music parameters with valid values."""
    universe = Universe(title='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = MusicParameters(
        universe_id=universe.id,
        harmony=0.8,
        tempo=120,
        key='C',
        scale='major'
    )
    session.add(params)
    session.commit()

    assert params.id is not None
    assert params.harmony == 0.8
    assert params.tempo == 120
    assert params.key == 'C'
    assert params.scale == 'major'

def test_music_parameter_validation(session):
    """Test music parameter validation rules."""
    universe = Universe(title='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    # Test harmony validation (must be between 0 and 1)
    with pytest.raises(ValueError):
        params = MusicParameters(
            universe_id=universe.id,
            harmony=1.5,
            tempo=120,
            key='C',
            scale='major'
        )
        session.add(params)
        session.commit()

    # Test tempo validation (must be positive)
    with pytest.raises(ValueError):
        params = MusicParameters(
            universe_id=universe.id,
            harmony=0.8,
            tempo=-120,
            key='C',
            scale='major'
        )
        session.add(params)
        session.commit()

    # Test key validation (must be valid musical key)
    with pytest.raises(ValueError):
        params = MusicParameters(
            universe_id=universe.id,
            harmony=0.8,
            tempo=120,
            key='H',
            scale='major'
        )
        session.add(params)
        session.commit()

    # Test scale validation (must be valid scale type)
    with pytest.raises(ValueError):
        params = MusicParameters(
            universe_id=universe.id,
            harmony=0.8,
            tempo=120,
            key='C',
            scale='invalid_scale'
        )
        session.add(params)
        session.commit()

def test_music_parameter_persistence(session):
    """Test music parameter persistence and retrieval."""
    universe = Universe(title='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = MusicParameters(
        universe_id=universe.id,
        harmony=0.8,
        tempo=120,
        key='C',
        scale='major'
    )
    session.add(params)
    session.commit()

    # Retrieve and verify
    retrieved_params = MusicParameters.query.filter_by(universe_id=universe.id).first()
    assert retrieved_params is not None
    assert retrieved_params.harmony == 0.8
    assert retrieved_params.tempo == 120
    assert retrieved_params.key == 'C'
    assert retrieved_params.scale == 'major'

def test_music_parameter_updates(session):
    """Test updating music parameters."""
    universe = Universe(title='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = MusicParameters(
        universe_id=universe.id,
        harmony=0.8,
        tempo=120,
        key='C',
        scale='major'
    )
    session.add(params)
    session.commit()

    # Update parameters
    params.harmony = 0.6
    params.tempo = 140
    params.key = 'G'
    params.scale = 'minor'
    session.commit()

    # Verify updates
    updated_params = MusicParameters.query.get(params.id)
    assert updated_params.harmony == 0.6
    assert updated_params.tempo == 140
    assert updated_params.key == 'G'
    assert updated_params.scale == 'minor'

def test_music_parameter_deletion(session):
    """Test cascade deletion of music parameters when universe is deleted."""
    universe = Universe(title='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = MusicParameters(
        universe_id=universe.id,
        harmony=0.8,
        tempo=120,
        key='C',
        scale='major'
    )
    session.add(params)
    session.commit()

    # Delete universe
    session.delete(universe)
    session.commit()

    # Verify music parameters were deleted
    assert MusicParameters.query.filter_by(universe_id=universe.id).first() is None

def test_valid_keys_and_scales(session):
    """Test all valid musical keys and scales."""
    universe = Universe(title='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    valid_keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']
    valid_scales = ['major', 'minor', 'harmonic minor', 'melodic minor', 'pentatonic', 'blues']

    for key in valid_keys:
        for scale in valid_scales:
            params = MusicParameters(
                universe_id=universe.id,
                harmony=0.8,
                tempo=120,
                key=key,
                scale=scale
            )
            session.add(params)
            session.commit()
            session.delete(params)
            session.commit()

def test_real_time_parameter_updates(session):
    """Test real-time parameter updates."""
    universe = Universe(title='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = MusicParameters(
        universe_id=universe.id,
        harmony=0.8,
        tempo=120,
        key='C',
        scale='major'
    )
    session.add(params)
    session.commit()

    # Simulate real-time updates
    updates = [
        {'harmony': 0.9, 'tempo': 125},
        {'harmony': 0.7, 'tempo': 130},
        {'harmony': 0.8, 'tempo': 135}
    ]

    for update in updates:
        params.harmony = update['harmony']
        params.tempo = update['tempo']
        session.commit()

        # Verify immediate update
        current_params = MusicParameters.query.get(params.id)
        assert current_params.harmony == update['harmony']
        assert current_params.tempo == update['tempo']
