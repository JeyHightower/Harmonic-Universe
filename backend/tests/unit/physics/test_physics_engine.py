"""Test physics engine implementation."""
import pytest
from app.physics.engine import PhysicsEngine, Particle, Vector2D, BoundaryType
from dataclasses import asdict

class TestPhysicsEngine:
    """Test physics engine functionality."""

    @pytest.fixture
    def engine(self):
        """Create a physics engine instance."""
        class MockParams:
            gravity = 9.81
            air_resistance = 0.1
            elasticity = 0.7
            friction = 0.3

        return PhysicsEngine(MockParams())

    def test_particle_force_application(self, engine):
        """Test applying force to a particle."""
        particle = engine.add_particle(
            position={'x': 0.0, 'y': 0.0},
            velocity={'x': 0.0, 'y': 0.0}
        )
        force = Vector2D(1.0, 2.0)
        particle.apply_force(force)

        assert particle.velocity.x == pytest.approx(1.0)
        assert particle.velocity.y == pytest.approx(2.0)

    def test_particle_update(self, engine):
        """Test particle position update."""
        particle = engine.add_particle(
            position={'x': 0.0, 'y': 0.0},
            velocity={'x': 1.0, 'y': 2.0}
        )
        dt = 0.1
        particle.update(dt)

        # x = x0 + v0t + 1/2at^2
        expected_x = 0.0 + 1.0 * dt + 0.5 * dt * dt
        expected_y = 0.0 + 2.0 * dt + 0.5 * dt * dt

        assert particle.position.x == pytest.approx(expected_x)
        assert particle.position.y == pytest.approx(expected_y)

    def test_boundary_wrap(self, engine):
        """Test wrap boundary behavior."""
        engine.set_boundary(
            boundary_type=BoundaryType.WRAP,
            x_min=-10.0,
            x_max=10.0,
            y_min=-10.0,
            y_max=10.0
        )

        particle = engine.add_particle(
            position={'x': 11.0, 'y': 11.0},
            velocity={'x': 1.0, 'y': 1.0}
        )

        engine.update(0.1)
        state = engine.get_state()

        assert -10.0 <= state['particles'][0]['position']['x'] <= 10.0
        assert -10.0 <= state['particles'][0]['position']['y'] <= 10.0

    def test_boundary_bounce(self, engine):
        """Test bounce boundary behavior."""
        engine.set_boundary(
            boundary_type=BoundaryType.BOUNCE,
            x_min=-10.0,
            x_max=10.0,
            y_min=-10.0,
            y_max=10.0,
            elasticity=0.7
        )

        particle = engine.add_particle(
            position={'x': 9.9, 'y': 9.9},
            velocity={'x': 1.0, 'y': 1.0}
        )

        engine.update(0.1)
        state = engine.get_state()

        # Velocity should be reversed and reduced by elasticity
        assert state['particles'][0]['velocity']['x'] < 0
        assert state['particles'][0]['velocity']['y'] < 0

    def test_boundary_absorb(self, engine):
        """Test absorb boundary behavior."""
        engine.set_boundary(
            boundary_type=BoundaryType.ABSORB,
            x_min=-10.0,
            x_max=10.0,
            y_min=-10.0,
            y_max=10.0
        )

        particle = engine.add_particle(
            position={'x': 11.0, 'y': 11.0},
            velocity={'x': 1.0, 'y': 1.0}
        )

        engine.update(0.1)
        state = engine.get_state()

        # Particle should be removed
        assert len(state['particles']) == 0

    def test_performance_metrics(self, engine):
        """Test performance metrics collection."""
        # Add some particles
        for i in range(5):
            engine.add_particle(
                position={'x': float(i), 'y': 0.0},
                velocity={'x': 1.0, 'y': 0.0}
            )

        # Run a few updates
        for _ in range(10):
            engine.update(0.1)

        metrics = engine.get_performance_metrics()

        assert 'frame_time' in metrics
        assert 'collision_count' in metrics
        assert 'particle_count' in metrics
        assert metrics['particle_count'] == 5

    def test_get_state(self, engine):
        """Test getting simulation state."""
        particle = engine.add_particle(
            position={'x': 0.0, 'y': 0.0},
            velocity={'x': 1.0, 'y': 2.0}
        )

        state = engine.get_state()

        assert 'particles' in state
        assert 'time' in state
        assert 'frame' in state
        assert len(state['particles']) == 1

        p_state = state['particles'][0]
        assert p_state['position']['x'] == 0.0
        assert p_state['position']['y'] == 0.0
        assert p_state['velocity']['x'] == 1.0
        assert p_state['velocity']['y'] == 2.0
