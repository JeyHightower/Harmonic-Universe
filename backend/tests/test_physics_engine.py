"""Tests for the physics simulation engine."""
import pytest
import numpy as np
from app.physics.engine import Vector2D, Particle, PhysicsEngine
from app.models import Universe, PhysicsParameters

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
    """Test vector operations."""
    v1 = Vector2D(1.0, 2.0)
    v2 = Vector2D(2.0, 3.0)

    # Test addition
    v3 = v1 + v2
    assert v3.x == 3.0
    assert v3.y == 5.0

    # Test subtraction
    v4 = v2 - v1
    assert v4.x == 1.0
    assert v4.y == 1.0

    # Test scalar multiplication
    v5 = v1 * 2
    assert v5.x == 2.0
    assert v5.y == 4.0

    # Test magnitude
    assert abs(v1.magnitude() - np.sqrt(5.0)) < 1e-10

    # Test normalization
    v6 = v1.normalize()
    assert abs(v6.magnitude() - 1.0) < 1e-10

def test_particle_creation():
    """Test particle creation and properties."""
    particle = Particle(
        position=Vector2D(1.0, 1.0),
        velocity=Vector2D(0.0, 0.0),
        acceleration=Vector2D(0.0, 0.0),
        mass=2.0,
        radius=1.5,
        elasticity=0.8,
        id=1
    )

    assert particle.position.x == 1.0
    assert particle.position.y == 1.0
    assert particle.mass == 2.0
    assert particle.radius == 1.5
    assert particle.elasticity == 0.8
    assert particle.id == 1

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

def test_physics_engine_creation(physics_parameters):
    """Test physics engine creation with parameters."""
    engine = PhysicsEngine(physics_parameters)
    assert engine.gravity == 9.81
    assert engine.elasticity == 0.7
    assert engine.air_resistance == 0.1

def test_add_particle_to_engine(physics_parameters):
    """Test adding particles to the physics engine."""
    engine = PhysicsEngine(physics_parameters)
    particle = Particle(
        position=Vector2D(0.0, 0.0),
        velocity=Vector2D(1.0, 1.0),
        acceleration=Vector2D(0.0, 0.0),
        mass=1.0,
        radius=1.0,
        elasticity=0.7,
        id=1
    )

    engine.add_particle(particle)
    assert len(engine.particles) == 1
    assert engine.particles[0] == particle

def test_gravity_force(physics_parameters):
    """Test gravity force application."""
    engine = PhysicsEngine(physics_parameters)
    particle = Particle(
        position=Vector2D(0.0, 0.0),
        velocity=Vector2D(0.0, 0.0),
        acceleration=Vector2D(0.0, 0.0),
        mass=1.0,
        radius=1.0,
        elasticity=0.7,
        id=1
    )

    engine.add_particle(particle)
    engine.apply_gravity()

    assert particle.acceleration.y == -9.81

def test_air_resistance(physics_parameters):
    """Test air resistance force application."""
    engine = PhysicsEngine(physics_parameters)
    particle = Particle(
        position=Vector2D(0.0, 0.0),
        velocity=Vector2D(10.0, 0.0),
        acceleration=Vector2D(0.0, 0.0),
        mass=1.0,
        radius=1.0,
        elasticity=0.7,
        id=1
    )

    engine.add_particle(particle)
    engine.apply_air_resistance()

    # Air resistance should oppose motion
    assert particle.acceleration.x < 0
    assert abs(particle.acceleration.y) < 1e-10

def test_collision_detection(physics_parameters):
    """Test collision detection between particles."""
    engine = PhysicsEngine(physics_parameters)
    p1 = Particle(
        position=Vector2D(0.0, 0.0),
        velocity=Vector2D(1.0, 0.0),
        acceleration=Vector2D(0.0, 0.0),
        mass=1.0,
        radius=1.0,
        elasticity=0.7,
        id=1
    )
    p2 = Particle(
        position=Vector2D(1.5, 0.0),
        velocity=Vector2D(-1.0, 0.0),
        acceleration=Vector2D(0.0, 0.0),
        mass=1.0,
        radius=1.0,
        elasticity=0.7,
        id=2
    )

    engine.add_particle(p1)
    engine.add_particle(p2)

    collisions = engine.detect_collisions()
    assert len(collisions) == 1
    assert collisions[0] == (p1, p2)

def test_collision_resolution(physics_parameters):
    """Test collision resolution between particles."""
    engine = PhysicsEngine(physics_parameters)
    p1 = Particle(
        position=Vector2D(0.0, 0.0),
        velocity=Vector2D(1.0, 0.0),
        acceleration=Vector2D(0.0, 0.0),
        mass=1.0,
        radius=1.0,
        elasticity=0.7,
        id=1
    )
    p2 = Particle(
        position=Vector2D(1.5, 0.0),
        velocity=Vector2D(-1.0, 0.0),
        acceleration=Vector2D(0.0, 0.0),
        mass=1.0,
        radius=1.0,
        elasticity=0.7,
        id=2
    )

    engine.add_particle(p1)
    engine.add_particle(p2)

    # Calculate initial momentum and energy
    initial_momentum = p1.mass * p1.velocity.x + p2.mass * p2.velocity.x
    initial_energy = 0.5 * p1.mass * p1.velocity.x**2 + 0.5 * p2.mass * p2.velocity.x**2

    engine.resolve_collisions([(p1, p2)])

    # Calculate final momentum and energy
    final_momentum = p1.mass * p1.velocity.x + p2.mass * p2.velocity.x
    final_energy = 0.5 * p1.mass * p1.velocity.x**2 + 0.5 * p2.mass * p2.velocity.x**2

    # Check conservation laws
    assert abs(final_momentum - initial_momentum) < 1e-10  # Momentum should be conserved
    assert final_energy <= initial_energy  # Energy should be conserved or decrease
    assert final_energy >= initial_energy * (p1.elasticity ** 2)  # Energy loss bounded by elasticity

    # Check velocity directions
    assert p1.velocity.x < 0  # First particle should move left
    assert p2.velocity.x > 0  # Second particle should move right

def test_energy_calculation(physics_parameters):
    """Test energy calculation in the system."""
    engine = PhysicsEngine(physics_parameters)
    particle = Particle(
        position=Vector2D(0.0, 10.0),
        velocity=Vector2D(1.0, 0.0),
        acceleration=Vector2D(0.0, 0.0),
        mass=1.0,
        radius=1.0,
        elasticity=0.7,
        id=1
    )

    engine.add_particle(particle)

    # Total energy = KE + PE
    # KE = 1/2 * m * v^2 = 0.5 * 1.0 * 1.0 = 0.5
    # PE = m * g * h = 1.0 * 9.81 * 10.0 = 98.1
    expected_energy = 98.6  # 0.5 + 98.1

    assert abs(engine.calculate_total_energy() - expected_energy) < 1e-10

def test_simulation_update(physics_parameters):
    """Test complete simulation update."""
    engine = PhysicsEngine(physics_parameters)
    particle = Particle(
        position=Vector2D(0.0, 10.0),
        velocity=Vector2D(1.0, 0.0),
        acceleration=Vector2D(0.0, 0.0),
        mass=1.0,
        radius=1.0,
        elasticity=0.7,
        id=1
    )

    engine.add_particle(particle)
    initial_energy = engine.calculate_total_energy()

    # Run simulation for a few steps
    for _ in range(10):
        engine.update(0.1)

    # Energy should decrease due to air resistance
    assert engine.calculate_total_energy() < initial_energy
