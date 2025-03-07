#!/usr/bin/env python
"""
Initialize Migrations Script

This script initializes and applies database migrations using Flask-Migrate.
Use this when you need to start tracking your database schema changes with Alembic.
"""
import os
import sys
import logging
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("migration_init")

try:
    from flask import Flask
    from flask_sqlalchemy import SQLAlchemy
    from flask_migrate import Migrate, init, migrate, stamp, upgrade
except ImportError as e:
    logger.error(f"Required package not found: {e}")
    logger.error("Please install required packages: pip install flask flask-sqlalchemy flask-migrate")
    sys.exit(1)

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    logger.error("DATABASE_URL environment variable not set")
    sys.exit(1)

# Mask password in logs
masked_url = DATABASE_URL
if "@" in DATABASE_URL:
    parts = DATABASE_URL.split('@')
    if '://' in parts[0]:
        protocol_parts = parts[0].split('://')
        masked_url = f"{protocol_parts[0]}://****:****@{parts[1]}"

logger.info(f"Using database URL: {masked_url}")

def create_minimal_app():
    """Create a minimal Flask application for migrations."""
    logger.info("Creating minimal Flask application")

    try:
        # Try to import the actual app factory
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        try:
            # First try to import create_app from app
            from app import create_app, db
            logger.info("Using application factory from app package")
            return create_app(), db
        except (ImportError, AttributeError):
            # If that fails, try to import from main module
            try:
                from app import app, db
                logger.info("Using application instance from app package")
                return app, db
            except (ImportError, AttributeError):
                # As a last resort, create a minimal app
                logger.warning("Could not import app, creating minimal Flask app")
                app = Flask("minimal_migration_app")
                app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
                app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
                db = SQLAlchemy(app)
                return app, db
    except Exception as e:
        logger.error(f"Error creating Flask app: {e}")
        raise

def check_alembic_version(db):
    """Check if alembic_version table exists."""
    try:
        with db.engine.connect() as conn:
            result = conn.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alembic_version')")
            exists = result.scalar()
            logger.info(f"alembic_version table exists: {exists}")
            return exists
    except Exception as e:
        logger.error(f"Error checking alembic_version table: {e}")
        return False

def check_existing_tables(db):
    """Check if any tables already exist in the database."""
    try:
        with db.engine.connect() as conn:
            result = conn.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
            count = result.scalar()
            logger.info(f"Found {count} existing tables in database")

            if count > 0:
                # Get table names for logging
                result = conn.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
                tables = [row[0] for row in result]
                logger.info(f"Existing tables: {', '.join(tables)}")

            return count > 0
    except Exception as e:
        logger.error(f"Error checking existing tables: {e}")
        return False

def initialize_migrations():
    """Initialize and apply migrations."""
    logger.info("Initializing migrations...")

    try:
        # Create Flask app
        app, db = create_minimal_app()

        with app.app_context():
            # Check database connection
            try:
                db.engine.execute("SELECT 1")
                logger.info("Database connection successful")
            except Exception as e:
                logger.error(f"Database connection failed: {e}")
                return False

            # Check if alembic_version already exists
            if check_alembic_version(db):
                logger.info("Alembic migrations are already initialized")
                return True

            # Check if tables exist
            tables_exist = check_existing_tables(db)

            # Initialize Flask-Migrate
            migrations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations')
            migrate = Migrate(app, db, directory=migrations_dir)
            logger.info(f"Migrations directory: {migrations_dir}")

            # Create migrations directory
            if not os.path.exists(migrations_dir):
                logger.info("Initializing migrations directory")
                try:
                    init(directory=migrations_dir)
                    logger.info("Migration directory initialized")
                except Exception as e:
                    logger.error(f"Failed to initialize migrations directory: {e}")
                    return False

            if tables_exist:
                logger.info("Tables already exist, marking current state as migrated")
                try:
                    # Create a migration without applying it
                    migrate(directory=migrations_dir, message="Initial migration", autogenerate=True)
                    logger.info("Initial migration created")

                    # Mark the migration as applied without running it
                    stamp(directory=migrations_dir, revision='head')
                    logger.info("Database stamped with current migration head")
                except Exception as e:
                    logger.error(f"Failed to stamp database: {e}")
                    return False
            else:
                logger.info("No tables exist, creating and applying initial migration")
                try:
                    # Create a migration
                    migrate(directory=migrations_dir, message="Initial migration", autogenerate=True)
                    logger.info("Initial migration created")

                    # Apply the migration
                    upgrade(directory=migrations_dir)
                    logger.info("Initial migration applied")
                except Exception as e:
                    logger.error(f"Failed to apply migration: {e}")
                    return False

            logger.info("Migration initialization completed successfully")
            return True

    except Exception as e:
        logger.error(f"Error initializing migrations: {e}")
        return False

if __name__ == "__main__":
    success = initialize_migrations()
    if success:
        logger.info("Migration initialization completed successfully")
        sys.exit(0)
    else:
        logger.error("Migration initialization failed")
        sys.exit(1)
