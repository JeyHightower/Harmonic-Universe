"""Tests for the physics simulation engine."""
import pytest
import numpy as np
from app.physics.engine import Vector2D, Particle, PhysicsEngine, BoundaryType
from app.models import Universe, PhysicsParameters
import math

@pytest.fixture
def universe():
    """Create a universe for testing."""
    return Universe(
        name="Test Universe",
        description="A universe for testing physics"
    )

@pytest.fixture
def physics_parameters(universe):
    """Create physics parameters for testing."""
    return PhysicsParameters(
        universe=universe,
        gravity=9.81,
        elasticity=0.7,
        friction=0.3,
        air_resistance=0.1,
        density=1.0,
        time_scale=1.0,
        max_time_step=1/60,
        particle_min_radius=0.5,
        particle_max_radius=2.0,
        particle_min_mass=0.1,
        particle_max_mass=5.0,
        max_particles=100,
        field_strength=1.0,
        field_radius=10.0,
        field_falloff=2.0,
        collision_damping=0.1,
        collision_threshold=0.01,
        restitution_coefficient=0.8
    )

def test_vector_operations():
    """Test Vector2D operations."""
    v1 = Vector2D(1, 2)
    v2 = Vector2D(3, 4)

    # Addition
    v3 = v1 + v2
    assert v3.x == 4
    assert v3.y == 6

    # Subtraction
    v4 = v2 - v1
    assert v4.x == 2
    assert v4.y == 2

    # Scalar multiplication
    v5 = v1 * 2
    assert v5.x == 2
    assert v5.y == 4

    # Magnitude
    assert math.isclose(v1.magnitude(), math.sqrt(5))

    # Normalization
    v6 = v1.normalize()
    assert math.isclose(v6.magnitude(), 1.0)

def test_particle_creation():
    """Test particle creation and properties."""
    pos = Vector2D(1, 2)
    vel = Vector2D(3, 4)
    particle = Particle(pos, vel, mass=2.0, radius=0.5)

    assert particle.position.x == 1
    assert particle.position.y == 2
    assert particle.velocity.x == 3
    assert particle.velocity.y == 4
    assert particle.mass == 2.0
    assert particle.radius == 0.5
    assert particle.id is not None

def test_particle_force_application():
    """Test force application to particles."""
    particle = Particle(
        position=Vector2D(0.0, 0.0),
        velocity=Vector2D(0.0, 0.0),
        acceleration=Vector2D(0.0, 0.0),
        mass=2.0,
        radius=1.0,
        elasticity=0.7,
        id=1
    )

    force = Vector2D(10.0, -5.0)
    particle.apply_force(force)

    # F = ma, so a = F/m
    assert particle.acceleration.x == 5.0  # 10.0 / 2.0
    assert particle.acceleration.y == -2.5  # -5.0 / 2.0

def test_particle_update():
    """Test particle position and velocity updates."""
    particle = Particle(
        position=Vector2D(0.0, 0.0),
        velocity=Vector2D(1.0, 1.0),
        acceleration=Vector2D(0.5, 0.5),
        mass=1.0,
        radius=1.0,
        elasticity=0.7,
        id=1
    )

    dt = 2.0
    particle.update(dt)

    # v = v0 + at
    assert particle.velocity.x == 2.0  # 1.0 + 0.5 * 2.0
    assert particle.velocity.y == 2.0

    # x = x0 + v0t + 0.5at^2
    assert particle.position.x == 3.0  # 0.0 + 1.0 * 2.0 + 0.5 * 0.5 * 4.0
    assert particle.position.y == 3.0

def test_physics_engine_creation():
    """Test physics engine creation with parameters."""
    params = PhysicsParameters(
        gravity=9.81,
        air_resistance=0.1,
        elasticity=0.8,
        friction=0.2
    )
    engine = PhysicsEngine(params)

    assert engine.gravity == 9.81
    assert engine.air_resistance == 0.1
    assert engine.elasticity == 0.8
    assert engine.friction == 0.2
    assert len(engine.particles) == 0

def test_add_particle():
    """Test adding particles to the engine."""
    engine = PhysicsEngine(PhysicsParameters())

    pos = {'x': 1, 'y': 2}
    vel = {'x': 3, 'y': 4}
    particle = engine.add_particle(pos, vel, mass=2.0, radius=0.5)

    assert len(engine.particles) == 1
    assert particle.position.x == 1
    assert particle.position.y == 2
    assert particle.velocity.x == 3
    assert particle.velocity.y == 4
    assert particle.mass == 2.0
    assert particle.radius == 0.5

def test_apply_gravity():
    """Test gravity application to particles."""
    params = PhysicsParameters(gravity=9.81)
    engine = PhysicsEngine(params)

    particle = engine.add_particle(
        position={'x': 0, 'y': 0},
        velocity={'x': 0, 'y': 0}
    )

    dt = 1.0
    engine.apply_gravity(dt)
    assert particle.velocity.y == -9.81

def test_apply_air_resistance():
    """Test air resistance application to particles."""
    params = PhysicsParameters(air_resistance=0.1)
    engine = PhysicsEngine(params)

    particle = engine.add_particle(
        position={'x': 0, 'y': 0},
        velocity={'x': 10, 'y': 0}
    )

    dt = 1.0
    engine.apply_air_resistance(dt)
    assert particle.velocity.x < 10  # Velocity should decrease

def test_detect_collisions():
    """Test collision detection between particles."""
    engine = PhysicsEngine(PhysicsParameters())

    p1 = engine.add_particle(
        position={'x': 0, 'y': 0},
        velocity={'x': 1, 'y': 0},
        radius=1.0
    )
    p2 = engine.add_particle(
        position={'x': 1.5, 'y': 0},
        velocity={'x': -1, 'y': 0},
        radius=1.0
    )

    collisions = engine.detect_collisions()
    assert len(collisions) == 1
    assert (p1, p2) in collisions or (p2, p1) in collisions

def test_resolve_collisions():
    """Test collision resolution between particles."""
    params = PhysicsParameters(elasticity=1.0)  # Perfect elasticity
    engine = PhysicsEngine(params)

    p1 = engine.add_particle(
        position={'x': 0, 'y': 0},
        velocity={'x': 1, 'y': 0},
        mass=1.0
    )
    p2 = engine.add_particle(
        position={'x': 1, 'y': 0},
        velocity={'x': -1, 'y': 0},
        mass=1.0
    )

    # Store initial velocities
    v1_init = p1.velocity.x
    v2_init = p2.velocity.x

    engine.resolve_collisions([(p1, p2)])

    # For perfectly elastic collision with equal masses,
    # velocities should swap
    assert math.isclose(p1.velocity.x, v2_init)
    assert math.isclose(p2.velocity.x, v1_init)

def test_boundary_wrap():
    """Test wrap boundary behavior."""
    engine = PhysicsEngine(PhysicsParameters())
    engine.set_boundary(
        boundary_type='wrap',
        x_min=-10,
        x_max=10,
        y_min=-10,
        y_max=10
    )

    particle = engine.add_particle(
        position={'x': 11, 'y': 11},
        velocity={'x': 1, 'y': 1}
    )

    engine.update(1.0)
    assert -10 <= particle.position.x <= 10
    assert -10 <= particle.position.y <= 10

def test_boundary_bounce():
    """Test bounce boundary behavior."""
    engine = PhysicsEngine(PhysicsParameters())
    engine.set_boundary(
        boundary_type='bounce',
        x_min=-10,
        x_max=10,
        y_min=-10,
        y_max=10,
        elasticity=1.0
    )

    particle = engine.add_particle(
        position={'x': 9, 'y': 0},
        velocity={'x': 2, 'y': 0}
    )

    engine.update(1.0)
    assert particle.velocity.x < 0  # Should bounce back

def test_boundary_absorb():
    """Test absorb boundary behavior."""
    engine = PhysicsEngine(PhysicsParameters())
    engine.set_boundary(
        boundary_type='absorb',
        x_min=-10,
        x_max=10,
        y_min=-10,
        y_max=10
    )

    particle = engine.add_particle(
        position={'x': 9, 'y': 0},
        velocity={'x': 2, 'y': 0}
    )

    engine.update(1.0)
    assert len(engine.particles) == 0  # Particle should be absorbed

def test_energy_conservation():
    """Test energy conservation in elastic collisions."""
    params = PhysicsParameters(
        gravity=0,
        air_resistance=0,
        elasticity=1.0,
        friction=0
    )
    engine = PhysicsEngine(params)

    p1 = engine.add_particle(
        position={'x': 0, 'y': 0},
        velocity={'x': 1, 'y': 0},
        mass=1.0
    )
    p2 = engine.add_particle(
        position={'x': 2, 'y': 0},
        velocity={'x': -1, 'y': 0},
        mass=1.0
    )

    # Calculate initial energy
    initial_energy = sum(0.5 * p.mass * p.velocity.magnitude()**2
                        for p in engine.particles)

    engine.update(1.0)

    # Calculate final energy
    final_energy = sum(0.5 * p.mass * p.velocity.magnitude()**2
                      for p in engine.particles)

    assert math.isclose(initial_energy, final_energy, rel_tol=1e-10)

def test_performance_metrics():
    """Test performance metrics tracking."""
    engine = PhysicsEngine(PhysicsParameters())

    # Add some particles
    for i in range(10):
        engine.add_particle(
            position={'x': i, 'y': 0},
            velocity={'x': 1, 'y': 0}
        )

    # Run several updates
    for _ in range(10):
        engine.update(1/60)

    # Get performance metrics
    metrics = engine.get_performance_metrics()

    assert 'frame_time' in metrics
    assert 'collision_count' in metrics
    assert 'particle_count' in metrics
    assert metrics['particle_count'] == 10

def test_get_state():
    """Test getting complete simulation state."""
    engine = PhysicsEngine(PhysicsParameters())

    # Add particle and set boundary
    engine.add_particle(
        position={'x': 0, 'y': 0},
        velocity={'x': 1, 'y': 1}
    )
    engine.set_boundary(
        boundary_type='bounce',
        x_min=-10,
        x_max=10,
        y_min=-10,
        y_max=10
    )

    # Get state
    state = engine.get_state()

    assert 'particles' in state
    assert 'boundary' in state
    assert 'performance' in state
    assert len(state['particles']) == 1
    assert state['boundary']['type'] == 'bounce'
    assert 'frame_time' in state['performance']
