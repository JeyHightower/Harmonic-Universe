"""CLI commands for the application."""
import click
from flask.cli import with_appcontext
from .models import User, Universe, PhysicsParameters

@click.command('reset-test-db')
@with_appcontext
def reset_test_db():
    """Reset test database."""
    from .extensions import db

    # Drop all tables
    db.drop_all()

    # Create tables
    db.create_all()

    # Create test user
    test_user = User(
        username='testuser',
        email='test@example.com'
    )
    test_user.set_password('password123')
    db.session.add(test_user)

    # Create test universe
    test_universe = Universe(
        name='Test Universe',
        description='A test universe',
        creator=test_user,
        is_public=True
    )
    db.session.add(test_universe)

    # Create test physics parameters
    physics_params = PhysicsParameters(
        universe=test_universe,
        gravity=9.81,
        particle_speed=1.0,
        collision_damping=0.8,
        boundary_damping=0.9,
        particle_mass=1.0,
        particle_radius=0.5
    )
    db.session.add(physics_params)

    # Commit changes
    db.session.commit()

    click.echo('Test database has been reset with sample data.')
