import pytest
from app.models import VisualizationParameters, Universe
from app.extensions import db
from sqlalchemy.exc import IntegrityError

def test_visualization_parameter_creation(session):
    """Test creating visualization parameters with valid values."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = VisualizationParameters(
        universe_id=universe.id,
        background_color='#FF0000',
        particle_color='#00FF00',
        glow_color='#0000FF',
        particle_count=1000,
        particle_size=2.0,
        particle_speed=1.0
    )
    session.add(params)
    session.commit()

    assert params.id is not None
    assert params.background_color == '#FF0000'
    assert params.particle_color == '#00FF00'
    assert params.glow_color == '#0000FF'
    assert params.particle_count == 1000
    assert params.particle_size == 2.0
    assert params.particle_speed == 1.0

def test_visualization_parameter_validation(session):
    """Test visualization parameter validation rules."""
    # Test color validation
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    with pytest.raises(ValueError):
        params = VisualizationParameters(
            universe_id=universe.id,
            background_color='invalid',  # Invalid hex color
            particle_color='#00FF00',
            glow_color='#0000FF'
        )
        session.add(params)
        session.flush()
    session.rollback()

    # Test particle count validation
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    with pytest.raises(ValueError):
        params = VisualizationParameters(
            universe_id=universe.id,
            particle_count=20000  # Above maximum
        )
        session.add(params)
        session.flush()
    session.rollback()

    # Test particle size validation
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    with pytest.raises(ValueError):
        params = VisualizationParameters(
            universe_id=universe.id,
            particle_size=15.0  # Above maximum
        )
        session.add(params)
        session.flush()
    session.rollback()

def test_visualization_parameter_persistence(session):
    """Test visualization parameter persistence and retrieval."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = VisualizationParameters(
        universe_id=universe.id,
        background_color='#FF0000',
        particle_color='#00FF00',
        glow_color='#0000FF',
        particle_count=1000,
        particle_size=2.0,
        particle_speed=1.0
    )
    session.add(params)
    session.commit()

    # Retrieve and verify
    retrieved_params = VisualizationParameters.query.filter_by(universe_id=universe.id).first()
    assert retrieved_params is not None
    assert retrieved_params.background_color == '#FF0000'
    assert retrieved_params.particle_color == '#00FF00'
    assert retrieved_params.glow_color == '#0000FF'
    assert retrieved_params.particle_count == 1000
    assert retrieved_params.particle_size == 2.0
    assert retrieved_params.particle_speed == 1.0

def test_visualization_parameter_updates(session):
    """Test updating visualization parameters."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = VisualizationParameters(
        universe_id=universe.id,
        background_color='#FF0000',
        particle_color='#00FF00',
        glow_color='#0000FF',
        particle_count=1000,
        particle_size=2.0,
        particle_speed=1.0
    )
    session.add(params)
    session.commit()

    # Update parameters
    params.background_color = '#000000'
    params.particle_count = 500
    params.particle_size = 1.5
    session.commit()

    # Verify updates
    updated_params = VisualizationParameters.query.get(params.id)
    assert updated_params.background_color == '#000000'
    assert updated_params.particle_count == 500
    assert updated_params.particle_size == 1.5

def test_visualization_parameter_deletion(session):
    """Test cascade deletion of visualization parameters when universe is deleted."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    params = VisualizationParameters(
        universe_id=universe.id,
        background_color='#FF0000',
        particle_color='#00FF00',
        glow_color='#0000FF'
    )
    session.add(params)
    session.commit()

    # Delete universe
    session.delete(universe)
    session.commit()

    # Verify visualization parameters were deleted
    assert VisualizationParameters.query.filter_by(universe_id=universe.id).first() is None

def test_visual_effects_validation(session):
    """Test validation of visual effects parameters."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    # Test glow intensity validation
    with pytest.raises(ValueError):
        params = VisualizationParameters(
            universe_id=universe.id,
            glow_intensity=2.0  # Above maximum
        )
        session.add(params)
        session.flush()
    session.rollback()

    # Test blur amount validation
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    with pytest.raises(ValueError):
        params = VisualizationParameters(
            universe_id=universe.id,
            blur_amount=1.5  # Above maximum
        )
        session.add(params)
        session.flush()
    session.rollback()

def test_animation_parameter_validation(session):
    """Test validation of animation parameters."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    # Test animation speed validation
    with pytest.raises(ValueError):
        params = VisualizationParameters(
            universe_id=universe.id,
            animation_speed=6.0  # Above maximum
        )
        session.add(params)
        session.flush()
    session.rollback()

    # Test bounce factor validation
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    with pytest.raises(ValueError):
        params = VisualizationParameters(
            universe_id=universe.id,
            bounce_factor=1.5  # Above maximum
        )
        session.add(params)
        session.flush()
    session.rollback()

def test_camera_parameter_validation(session):
    """Test validation of camera parameters."""
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    # Test camera zoom validation
    with pytest.raises(ValueError):
        params = VisualizationParameters(
            universe_id=universe.id,
            camera_zoom=15.0  # Above maximum
        )
        session.add(params)
        session.flush()
    session.rollback()

    # Test camera rotation validation
    universe = Universe(name='Test Universe', user_id=1)
    session.add(universe)
    session.commit()

    with pytest.raises(ValueError):
        params = VisualizationParameters(
            universe_id=universe.id,
            camera_rotation=400.0  # Above maximum
        )
        session.add(params)
        session.flush()
    session.rollback()
