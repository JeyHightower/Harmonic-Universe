#!/usr/bin/env python3
import click
import os
import subprocess
from flask.cli import FlaskGroup
from app import create_app
from app.models import db
from alembic.config import Config
from alembic import command

app = create_app()
cli = FlaskGroup(create_app=create_app)

@cli.command()
def create_db():
    """Create a fresh database."""
    click.echo('Creating database...')
    db.create_all()
    click.echo('Database created!')

@cli.command()
def drop_db():
    """Drop the database."""
    if click.confirm('Are you sure you want to drop the database?'):
        click.echo('Dropping database...')
        db.drop_all()
        click.echo('Database dropped!')

@cli.command()
def init_db():
    """Initialize the database with sample data."""
    click.echo('Initializing database with sample data...')
    # Add your initialization code here
    click.echo('Database initialized!')

@cli.command()
@click.option('--message', '-m', required=True, help='Migration message')
def db_migrate(message):
    """Create a new migration."""
    alembic_cfg = Config("alembic.ini")
    command.revision(alembic_cfg, autogenerate=True, message=message)
    click.echo('Migration created!')

@cli.command()
def db_upgrade():
    """Upgrade database to latest revision."""
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    click.echo('Database upgraded!')

@cli.command()
def db_downgrade():
    """Downgrade database by one revision."""
    alembic_cfg = Config("alembic.ini")
    command.downgrade(alembic_cfg, "-1")
    click.echo('Database downgraded!')

@cli.command()
def test():
    """Run the tests."""
    import pytest
    pytest.main(['tests'])

@cli.command()
def setup():
    """Set up the development environment."""
    click.echo('Setting up development environment...')

    # Create virtual environment if it doesn't exist
    if not os.path.exists('venv'):
        subprocess.run(['python', '-m', 'venv', 'venv'])

    # Install dependencies
    pip_cmd = 'venv/bin/pip' if os.name != 'nt' else r'venv\Scripts\pip'
    subprocess.run([pip_cmd, 'install', '-r', 'requirements.txt'])

    # Set up database
    click.echo('Setting up database...')
    create_db()
    db_upgrade()

    click.echo('Development environment setup complete!')

@cli.command()
def clean():
    """Clean up temporary files and caches."""
    click.echo('Cleaning up...')

    # Add directories to clean
    dirs_to_clean = [
        '__pycache__',
        '.pytest_cache',
        'instance',
        'build',
        'dist',
        '*.egg-info',
    ]

    for pattern in dirs_to_clean:
        os.system(f'find . -type d -name "{pattern}" -exec rm -rf {{}} +')

    # Clean .pyc files
    os.system('find . -type f -name "*.pyc" -delete')

    click.echo('Cleanup complete!')

@cli.command()
def deploy():
    """Deploy the application."""
    click.echo('Deploying application...')

    # Run tests
    if not click.confirm('Skip tests?'):
        test()

    # Clean up
    clean()

    # Install production dependencies
    subprocess.run(['pip', 'install', '-r', 'requirements.txt'])

    # Run migrations
    db_upgrade()

    click.echo('Deployment complete!')

@cli.command()
def dev():
    """Start development server with hot reload."""
    click.echo('Starting development server...')
    subprocess.run(['flask', 'run', '--debug'])

if __name__ == '__main__':
    cli()
