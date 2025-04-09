#!/usr/bin/env python3
"""
Database setup script for Harmonic Universe.

This script provides a single source of truth for database initialization.
It handles migrations setup and database verification.

PostgreSQL is required for all environments, especially production.

Usage:
  python setup_db.py              # Initialize database and apply migrations
  python setup_db.py --reset      # Reset database (drop all tables) and recreate
  python setup_db.py --init-only  # Only initialize migrations, don't attempt any database operations
"""

import os
import sys
import argparse
from pathlib import Path
from sqlalchemy.exc import SQLAlchemyError
from urllib.parse import urlparse

def setup_db(reset_db=False, init_only=False):
    """
    Set up the database using PostgreSQL exclusively.
    
    Args:
        reset_db (bool, optional): Whether to reset the database. Defaults to False.
        init_only (bool, optional): Whether to only initialize migrations. Defaults to False.
    """
    # Load required packages
    from app import create_app
    from app.extensions import db

    # Check if DATABASE_URL is set
    database_url = os.environ.get('DATABASE_URL')
    
    # Require PostgreSQL database
    if not database_url:
        print("ERROR: DATABASE_URL environment variable is not set.")
        print("PostgreSQL is required for this application.")
        print("Please set DATABASE_URL to a valid PostgreSQL connection string.")
        sys.exit(1)
        
    # If PostgreSQL, ensure URL format is correct
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
        os.environ['DATABASE_URL'] = database_url
        print("Converted 'postgres://' to 'postgresql://' for SQLAlchemy compatibility")
    
    # Validate URL format
    parsed_url = urlparse(database_url)
    if parsed_url.scheme not in ('postgresql', 'postgres'):
        print(f"ERROR: Unsupported database type: {parsed_url.scheme}")
        print("Only PostgreSQL is supported.")
        sys.exit(1)
    
    print(f"Using PostgreSQL database: {parsed_url.netloc}")

    # Create app with database configuration
    app = create_app()
    
    # If init_only, just initialize the migration environment
    if init_only:
        from flask_migrate import init, current
        with app.app_context():
            # Check if migrations are already initialized
            migrations_dir = Path('migrations')
            if migrations_dir.exists() and migrations_dir.is_dir():
                print("Migrations directory already exists")
            else:
                print("Initializing migrations directory...")
                init()
                print("Migrations initialized successfully")
        return True

    with app.app_context():
        # Handle database operations
        if reset_db:
            # For PostgreSQL: use SQLAlchemy to drop all tables
            print(f"Dropping all tables from the PostgreSQL database...")
            db.drop_all()
            print("All tables dropped successfully.")

        # Create database tables
        print(f"Creating database tables...")
        db.create_all()
        print("Database tables created successfully.")

        # Apply migrations
        from flask_migrate import Migrate, upgrade, init, migrate
        
        # Initialize Migrate extension
        migrate_obj = Migrate(app, db)
        
        # Check if migrations directory exists, if not initialize it
        migrations_dir = Path('migrations')
        if not migrations_dir.exists():
            print("Initializing migrations directory...")
            init()
            print("Creating initial migration...")
            migrate(message='Initial migration')
        
        # Apply migrations
        try:
            print("Applying database migrations...")
            upgrade()
            print("Database migrations applied successfully.")
        except SQLAlchemyError as e:
            print(f"WARNING: Failed to apply migrations: {str(e)}")
            print("You may need to manually initialize and apply migrations:")
            print("  flask db init       # If migrations directory doesn't exist")
            print("  flask db migrate -m 'Initial migration'")
            print("  flask db upgrade")
            print()
            print("For PostgreSQL users:")
            print("  1. Make sure your database exists and is accessible")
            print("  2. Check your DATABASE_URL in the .env file")
            print("  3. Ensure you have permission to create/modify tables")
            
            # Don't exit with error as tables may have been created successfully
            # even if migrations couldn't be applied

    print("Database setup completed successfully.")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Set up the PostgreSQL database")
    parser.add_argument("--reset", action="store_true", help="Reset the database (drop all tables)")
    parser.add_argument("--init-only", action="store_true", help="Only initialize migrations")
    args = parser.parse_args()
    
    setup_db(reset_db=args.reset, init_only=args.init_only)
