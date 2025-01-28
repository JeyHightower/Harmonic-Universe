"""Tests for PhysicsParameters model."""
import pytest
from app.models.physics_parameters import PhysicsParameters
from app.models.universe import Universe

def test_physics_parameters_creation(app, universe_factory):
    """Test creating physics parameters."""
    universe = universe_factory()

    physics_params = PhysicsParameters(
        universe_id=universe.id,
        gravity=10.0,
        time_dilation=1.5
    )

    assert physics_params.universe_id == universe.id
    assert physics_params.gravity == 10.0
    assert physics_params.time_dilation == 1.5

def test_physics_parameters_to_dict(app, universe_factory):
    """Test converting physics parameters to dictionary."""
    universe = universe_factory()

    physics_params = PhysicsParameters(
        universe_id=universe.id,
        gravity=10.0,
        time_dilation=1.5
    )

    params_dict = physics_params.to_dict()
    assert params_dict['gravity'] == 10.0
    assert params_dict['time_dilation'] == 1.5

def test_physics_parameters_update(app, universe_factory):
    """Test updating physics parameters."""
    universe = universe_factory()

    physics_params = PhysicsParameters(
        universe_id=universe.id,
        gravity=10.0,
        time_dilation=1.5
    )

    physics_params.update({
        'gravity': 15.0,
        'time_dilation': 2.0
    })

    assert physics_params.gravity == 15.0
    assert physics_params.time_dilation == 2.0

def test_physics_parameters_validation(app, universe_factory):
    """Test physics parameters validation."""
    universe = universe_factory()

    with pytest.raises(ValueError):
        PhysicsParameters(
            universe_id=universe.id,
            gravity=-1.0  # Invalid gravity value
        )

    with pytest.raises(ValueError):
        PhysicsParameters(
            universe_id=universe.id,
            time_dilation=0.0  # Invalid time dilation value
        )
