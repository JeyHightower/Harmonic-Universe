import click
from flask.cli import with_appcontext
from .extensions import db
from .models import User, Universe, Parameter

@click.command('reset-test-db')
@with_appcontext
def reset_test_db():
    """Reset test database to initial state."""
    if db.engine.url.database != 'test':
        click.echo('This command can only be run in test environment')
        return

    click.echo('Dropping all tables...')
    db.drop_all()

    click.echo('Creating all tables...')
    db.create_all()

    click.echo('Creating test data...')
    # Create test users
    test_user = User(
        username='testuser',
        email='test@example.com'
    )
    test_user.set_password('password123')
    db.session.add(test_user)

    collaborator = User(
        username='collaborator',
        email='collaborator@example.com'
    )
    collaborator.set_password('password123')
    db.session.add(collaborator)

    # Create test universe
    test_universe = Universe(
        name='Test Universe',
        description='A test universe',
        is_public=True,
        creator=test_user
    )
    db.session.add(test_universe)

    # Create test parameters
    physics_params = Parameter(
        universe=test_universe,
        type='physics',
        data={'gravity': 9.81, 'particle_speed': 1.0}
    )
    db.session.add(physics_params)

    db.session.commit()
    click.echo('Test database reset complete!')
