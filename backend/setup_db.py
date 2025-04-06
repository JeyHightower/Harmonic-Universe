#!/usr/bin/env python3
"""
Comprehensive database setup script for Harmonic Universe.

This script provides a single source of truth for database initialization.
It combines functionality from:
- init_db.py (table creation)
- init_migrations.py (migration setup)
- setup_db.py (database initialization)

Usage:
  python setup_db.py              # Full setup (delete existing DB, init migrations, create tables)
  python setup_db.py --no-reset   # Keep existing DB, just ensure tables and migrations
"""

import os
import sys
import argparse
from dotenv import load_dotenv
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def setup_database(reset_db=True):
    """
    Set up the database for the application.
    
    Args:
        reset_db: If True, deletes existing database and recreates it.
                  If False, keeps existing database and just ensures tables exist.
    """
    # Load environment variables
    load_dotenv()
    
    # Ensure instance directory exists
    instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
    if not os.path.exists(instance_path):
        os.makedirs(instance_path)
        os.chmod(instance_path, 0o777)
        print(f"Created instance directory: {instance_path}")
    
    # Database file path
    db_path = os.path.join(instance_path, 'app.db')
    
    if reset_db:
        # Remove existing database file if it exists
        if os.path.exists(db_path):
            os.remove(db_path)
            print(f"Removed existing database: {db_path}")
            
        # Create empty database file with proper permissions
        with open(db_path, 'w') as f:
            pass
        os.chmod(db_path, 0o666)
        print(f"Created new database file: {db_path}")
    else:
        print(f"Using existing database: {db_path}")
    
    # Set SQLite database URL explicitly
    os.environ['DATABASE_URL'] = f'sqlite:///{db_path}'
    
    # Import after setting DATABASE_URL
    from flask_migrate import Migrate, init, migrate as create_migration, upgrade
    from app import create_app, db
    
    # Import all models to ensure they are registered with SQLAlchemy
    from backend.app.api.models import (
        User, Note, Universe, Scene, Physics2D, Physics3D,
        PhysicsObject, PhysicsConstraint, SoundProfile,
        AudioSample, MusicPiece, Harmony, MusicalTheme,
        Character
    )
    
    # Create Flask application
    app = create_app()
    
    # Initialize Flask-Migrate
    migrate = Migrate(app, db)
    
    with app.app_context():
        if reset_db:
            # Remove existing migrations directory if it exists
            migrations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations')
            if os.path.exists(migrations_dir):
                import shutil
                shutil.rmtree(migrations_dir)
                print(f"Removed existing migrations directory: {migrations_dir}")
            
            # Initialize migrations
            init()
            print("Initialized Flask-Migrate")
            
            # Create a new migration
            create_migration(message='initial migration')
            print("Created initial migration")
            
            # Apply the migration
            upgrade()
            print("Applied initial migration")
        else:
            # Create tables directly if they don't exist
            db.create_all()
            print("Ensured database tables exist")
        
        print("Database setup completed successfully!")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Set up the database for Harmonic Universe')
    parser.add_argument('--no-reset', action='store_true', help='Do not reset the database')
    args = parser.parse_args()
    
    setup_database(not args.no_reset) 