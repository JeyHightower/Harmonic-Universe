import pytest
from app.models.base import PhysicsParameters, Universe
from sqlalchemy.exc import IntegrityError

def test_physics_parameter_creation(session):
    """Test creating physics parameters with valid values."""
    universe = Universe(title='Test Universe', user_id=1)
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
    universe = Universe(title='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    # Test gravity validation (must be positive)
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
        session.commit()

    # Test friction validation (must be between 0 and 1)
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
        session.commit()

    # Test elasticity validation (must be between 0 and 1)
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
        session.commit()

def test_physics_parameter_persistence(session):
    """Test physics parameter persistence and retrieval."""
    universe = Universe(title='Test Universe', user_id=1)
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
    universe = Universe(title='Test Universe', user_id=1)
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
    universe = Universe(title='Test Universe', user_id=1)
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
