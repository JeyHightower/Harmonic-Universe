#!/usr/bin/env python3
"""
Database initialization script for Harmonic Universe on Render.com.

This script ensures that all database tables exist in the production database.
It handles both PostgreSQL and SQLite databases.
"""

import os
import sys
from dotenv import load_dotenv

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def initialize_database():
    """Initialize the database for the application in production."""
    # Load environment variables
    load_dotenv()
    
    print("Starting database initialization...")
    
    # Fix for PostgreSQL URL format if needed
    database_url = os.environ.get('DATABASE_URL', '')
    if database_url.startswith('postgres://'):
        os.environ['DATABASE_URL'] = database_url.replace('postgres://', 'postgresql://', 1)
        print("Converted 'postgres://' to 'postgresql://' for SQLAlchemy compatibility")
    
    # Import Flask app and models
    from backend.app import create_app, db
    
    # Create Flask application
    app = create_app()
    
    # Import all models to ensure they are registered with SQLAlchemy
    from backend.app.api.models import (
        User, Note, Universe, Scene, Physics2D, Physics3D,
        PhysicsObject, PhysicsConstraint, SoundProfile,
        AudioSample, MusicPiece, Harmony, MusicalTheme,
        Character
    )
    
    with app.app_context():
        # First try to create all tables
        try:
            print("Creating tables if they don't exist...")
            db.create_all()
            print("Tables created successfully!")
        except Exception as e:
            print(f"Error creating tables: {str(e)}")
            
        # Check if tables exist
        try:
            # Try to query the users table
            result = db.session.execute(db.text("SELECT 1 FROM users LIMIT 1"))
            print("Users table exists and is accessible")
        except Exception as e:
            print(f"Error checking users table: {str(e)}")
            
            # Try Flask-Migrate as a fallback
            try:
                from flask_migrate import Migrate, init, migrate, upgrade
                
                print("Using Flask-Migrate to ensure database schema...")
                
                # Initialize Flask-Migrate
                migrate_obj = Migrate(app, db)
                
                # Check if migrations directory exists
                migrations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend/migrations')
                if not os.path.exists(migrations_dir):
                    print("Initializing migrations directory...")
                    init()
                
                # Create a migration
                print("Creating migration...")
                migrate(message="render_deployment")
                
                # Apply the migration
                print("Applying migration...")
                upgrade()
                
                print("Database migration completed successfully!")
            except Exception as migrate_error:
                print(f"Error using Flask-Migrate: {str(migrate_error)}")
                
                # Last resort: try to create tables directly with raw SQL
                try:
                    print("Attempting to create tables with raw SQL...")
                    
                    # User table
                    db.session.execute(db.text("""
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        username VARCHAR(64) NOT NULL,
                        email VARCHAR(120) NOT NULL UNIQUE,
                        password_hash VARCHAR(128),
                        version INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_deleted BOOLEAN DEFAULT FALSE
                    )
                    """))
                    
                    # Universe table
                    db.session.execute(db.text("""
                    CREATE TABLE IF NOT EXISTS universes (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        description TEXT,
                        user_id INTEGER NOT NULL,
                        version INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_public BOOLEAN DEFAULT FALSE,
                        is_deleted BOOLEAN DEFAULT FALSE
                    )
                    """))
                    
                    # Scenes table
                    db.session.execute(db.text("""
                    CREATE TABLE IF NOT EXISTS scenes (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        description TEXT,
                        universe_id INTEGER NOT NULL,
                        version INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_deleted BOOLEAN DEFAULT FALSE
                    )
                    """))
                    
                    # Characters table
                    db.session.execute(db.text("""
                    CREATE TABLE IF NOT EXISTS characters (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        description TEXT,
                        scene_id INTEGER NOT NULL,
                        version INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_deleted BOOLEAN DEFAULT FALSE
                    )
                    """))
                    
                    # Notes table
                    db.session.execute(db.text("""
                    CREATE TABLE IF NOT EXISTS notes (
                        id SERIAL PRIMARY KEY,
                        title VARCHAR(100) NOT NULL,
                        content TEXT,
                        user_id INTEGER NOT NULL,
                        universe_id INTEGER,
                        scene_id INTEGER,
                        character_id INTEGER,
                        tags JSONB,
                        position_x FLOAT DEFAULT 0,
                        position_y FLOAT DEFAULT 0,
                        position_z FLOAT DEFAULT 0,
                        is_public BOOLEAN DEFAULT FALSE,
                        is_archived BOOLEAN DEFAULT FALSE,
                        version INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_deleted BOOLEAN DEFAULT FALSE
                    )
                    """))
                    
                    # Commit the changes
                    db.session.commit()
                    print("Tables created successfully with raw SQL!")
                except Exception as sql_error:
                    print(f"Error creating tables with raw SQL: {str(sql_error)}")
    
    print("Database initialization completed!")

if __name__ == '__main__':
    initialize_database() 