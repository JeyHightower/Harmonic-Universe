#!/usr/bin/env python3
import os
import sys
import click
from flask import Flask
from flask.cli import with_appcontext
from flask_migrate import Migrate, upgrade
from sqlalchemy import text

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import User, Profile, Universe  # Import your models

app = create_app()
migrate = Migrate(app, db)

@click.group()
def cli():
    """Database management commands."""
    pass

@cli.command()
@with_appcontext
def init():
    """Initialize the database."""
    click.echo('Creating database tables...')
    db.create_all()
    click.echo('Database tables created.')

@cli.command()
@with_appcontext
def drop():
    """Drop all database tables."""
    if click.confirm('Are you sure you want to drop all tables?'):
        click.echo('Dropping database tables...')
        db.drop_all()
        click.echo('Database tables dropped.')

@cli.command()
@with_appcontext
def reset():
    """Reset the database (drop and recreate all tables)."""
    if click.confirm('Are you sure you want to reset the database?'):
        click.echo('Dropping database tables...')
        db.drop_all()
        click.echo('Creating database tables...')
        db.create_all()
        click.echo('Database reset complete.')

@cli.command()
@with_appcontext
def migrate_to_postgres():
    """Migrate SQLite database to PostgreSQL."""
    if not click.confirm('This will migrate your SQLite database to PostgreSQL. Continue?'):
        return

    # Get PostgreSQL URL
    postgres_url = click.prompt('Enter PostgreSQL URL',
                              default=os.environ.get('POSTGRES_DATABASE_URL'))

    # Verify current database is SQLite
    if not str(db.engine.url).startswith('sqlite'):
        click.echo('Current database is not SQLite. Aborting.')
        return

    click.echo('Starting migration to PostgreSQL...')

    # Create tables in PostgreSQL
    os.environ['DATABASE_URL'] = postgres_url
    new_app = create_app('production')
    with new_app.app_context():
        db.create_all()

        # Migrate data for each model
        models = [User, Profile, Universe]  # Add all your models here
        for model in models:
            click.echo(f'Migrating {model.__name__}...')
            records = model.query.all()
            for record in records:
                db.session.expunge(record)
                db.session.add(record)
            db.session.commit()

    click.echo('Migration to PostgreSQL complete.')

@cli.command()
@with_appcontext
def verify_migrations():
    """Verify all migrations are applied."""
    click.echo('Checking migrations...')
    with app.app_context():
        try:
            # Check if all migrations are applied
            upgrade()
            click.echo('All migrations are up to date.')

            # Verify database connection
            db.session.execute(text('SELECT 1'))
            click.echo('Database connection verified.')

        except Exception as e:
            click.echo(f'Error verifying migrations: {str(e)}')
            sys.exit(1)

if __name__ == '__main__':
    cli()
