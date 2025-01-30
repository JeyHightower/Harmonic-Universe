"""CLI commands for the application."""
import click
from flask.cli import with_appcontext
from .models import User, Universe, db
import os


def register_commands(app):
    """Register CLI commands with the Flask application."""
    app.cli.add_command(reset_test_db)
    app.cli.add_command(init_db_command)


@click.command("reset-test-db")
@with_appcontext
def reset_test_db():
    """Reset test database."""
    # Drop all tables
    db.drop_all()
    db.create_all()

    # Create test user
    test_user = User(
        username="testuser",
        email="test@example.com"
    )
    test_user.set_password("password123")
    db.session.add(test_user)

    # Create test universe
    test_universe = Universe(
        name="Test Universe",
        description="A test universe",
        creator=test_user,
        is_public=True
    )
    db.session.add(test_universe)
    db.session.commit()

    click.echo("Test database has been reset with sample data.")


@click.command("init-db")
@with_appcontext
def init_db_command():
    """Initialize the database."""
    os.makedirs("instance", exist_ok=True)
    db.create_all()
    click.echo("Initialized the database.")
