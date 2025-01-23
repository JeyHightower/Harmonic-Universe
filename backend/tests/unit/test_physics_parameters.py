import pytest
from app.models import PhysicsParameters, Universe
from app.extensions import db
from sqlalchemy.exc import IntegrityError

def test_physics_parameter_creation(session):
    """Test creating physics parameters with valid values."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = PhysicsParameters(
        universe_id=universe.id,
        gravity=9.81,
        friction=0.5,
        elasticity=0.7,
        air_resistance=0.1,
        density=1.0
    )
    session.add(params)
    session.commit()

    assert params.id is not None
    assert params.gravity == 9.81
    assert params.friction == 0.5

def test_physics_parameter_validation(session):
    """Test physics parameter validation rules."""
    # Test gravity validation (must be positive)
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    with pytest.raises(ValueError):
        params = PhysicsParameters(
            universe_id=universe.id,
            gravity=-1.0,
            friction=0.5,
            elasticity=0.7,
            air_resistance=0.1,
            density=1.0
        )
        session.add(params)
        session.flush()
    session.rollback()

    # Test friction validation (must be between 0 and 1)
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    with pytest.raises(ValueError):
        params = PhysicsParameters(
            universe_id=universe.id,
            gravity=9.81,
            friction=1.5,
            elasticity=0.7,
            air_resistance=0.1,
            density=1.0
        )
        session.add(params)
        session.flush()
    session.rollback()

    # Test elasticity validation (must be between 0 and 1)
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    with pytest.raises(ValueError):
        params = PhysicsParameters(
            universe_id=universe.id,
            gravity=9.81,
            friction=0.5,
            elasticity=1.5,
            air_resistance=0.1,
            density=1.0
        )
        session.add(params)
        session.flush()
    session.rollback()

def test_physics_parameter_persistence(session):
    """Test physics parameter persistence and retrieval."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = PhysicsParameters(
        universe_id=universe.id,
        gravity=9.81,
        friction=0.5,
        elasticity=0.7,
        air_resistance=0.1,
        density=1.0
    )
    session.add(params)
    session.commit()

    # Retrieve and verify
    retrieved_params = PhysicsParameters.query.filter_by(universe_id=universe.id).first()
    assert retrieved_params is not None
    assert retrieved_params.gravity == 9.81
    assert retrieved_params.friction == 0.5
    assert retrieved_params.elasticity == 0.7

def test_physics_parameter_updates(session):
    """Test updating physics parameters."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = PhysicsParameters(
        universe_id=universe.id,
        gravity=9.81,
        friction=0.5,
        elasticity=0.7,
        air_resistance=0.1,
        density=1.0
    )
    session.add(params)
    session.commit()

    # Update parameters
    params.gravity = 5.0
    params.friction = 0.3
    session.commit()

    # Verify updates
    updated_params = PhysicsParameters.query.get(params.id)
    assert updated_params.gravity == 5.0
    assert updated_params.friction == 0.3

def test_physics_parameter_deletion(session):
    """Test cascade deletion of physics parameters when universe is deleted."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = PhysicsParameters(
        universe_id=universe.id,
        gravity=9.81,
        friction=0.5,
        elasticity=0.7,
        air_resistance=0.1,
        density=1.0
    )
    session.add(params)
    session.commit()

    # Delete universe
    session.delete(universe)
    session.commit()

    # Verify physics parameters were deleted
    assert PhysicsParameters.query.filter_by(universe_id=universe.id).first() is None

def test_time_scale_validation(session):
    """Test time scale parameter validation."""
    # Test time_scale validation (must be between 0.1 and 10.0)
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    with pytest.raises(ValueError):
        params = PhysicsParameters(
            universe_id=universe.id,
            gravity=9.81,
            friction=0.5,
            elasticity=0.7,
            time_scale=0.05  # Below minimum
        )
        session.add(params)
        session.flush()
    session.rollback()

    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    with pytest.raises(ValueError):
        params = PhysicsParameters(
            universe_id=universe.id,
            gravity=9.81,
            friction=0.5,
            elasticity=0.7,
            time_scale=11.0  # Above maximum
        )
        session.add(params)
        session.flush()
    session.rollback()

    # Test valid time_scale
    params = PhysicsParameters(
        universe_id=universe.id,
        gravity=9.81,
        friction=0.5,
        elasticity=0.7,
        time_scale=2.0
    )
    session.add(params)
    session.commit()
    assert params.time_scale == 2.0

def test_parameter_ranges(session):
    """Test parameter range validations."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    # Test maximum values
    params = PhysicsParameters(
        universe_id=universe.id,
        gravity=1000.0,  # Maximum gravity
        friction=1.0,    # Maximum friction
        elasticity=1.0,  # Maximum elasticity
        time_scale=10.0  # Maximum time_scale
    )
    session.add(params)
    session.commit()
    assert params.gravity == 1000.0
    assert params.friction == 1.0
    assert params.elasticity == 1.0
    assert params.time_scale == 10.0

    # Test minimum values
    params = PhysicsParameters(
        universe_id=universe.id,
        gravity=0.1,    # Minimum gravity
        friction=0.0,   # Minimum friction
        elasticity=0.0, # Minimum elasticity
        time_scale=0.1  # Minimum time_scale
    )
    session.add(params)
    session.commit()
    assert params.gravity == 0.1
    assert params.friction == 0.0
    assert params.elasticity == 0.0
    assert params.time_scale == 0.1

def test_real_time_updates(session):
    """Test real-time parameter updates."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = PhysicsParameters(
        universe_id=universe.id,
        gravity=9.81,
        friction=0.5,
        elasticity=0.7,
        time_scale=1.0
    )
    session.add(params)
    session.commit()

    # Simulate real-time updates
    updates = [
        {'gravity': 5.0, 'time_scale': 2.0},
        {'gravity': 7.0, 'time_scale': 1.5},
        {'gravity': 3.0, 'time_scale': 0.5}
    ]

    for update in updates:
        params.gravity = update['gravity']
        params.time_scale = update['time_scale']
        session.commit()

        # Verify immediate update
        current_params = PhysicsParameters.query.get(params.id)
        assert current_params.gravity == update['gravity']
        assert current_params.time_scale == update['time_scale']

def test_parameter_interpolation(session):
    """Test parameter interpolation for smooth transitions."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = PhysicsParameters(
        universe_id=universe.id,
        gravity=10.0,
        friction=0.5,
        elasticity=0.7,
        time_scale=1.0
    )
    session.add(params)
    session.commit()

    # Test linear interpolation
    start_gravity = params.gravity
    target_gravity = 5.0
    steps = 5

    for i in range(1, steps + 1):
        # Calculate interpolated value
        t = i / steps
        interpolated_gravity = start_gravity + (target_gravity - start_gravity) * t

        params.gravity = interpolated_gravity
        session.commit()

        # Verify interpolated value
        current_params = PhysicsParameters.query.get(params.id)
        assert abs(current_params.gravity - interpolated_gravity) < 0.0001
