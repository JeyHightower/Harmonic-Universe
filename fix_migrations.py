#!/usr/bin/env python
"""
Fix migrations script - handles database migration state issues.
Use this when your tables already exist but the migration history doesn't reflect it.
"""
import os
import sys
import logging
import glob
from datetime import datetime
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import SQLAlchemyError, ProgrammingError

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

def find_migration_dirs():
    """Find all possible migration directories."""
    # Common migration directory paths
    possible_paths = [
        'migrations/versions',
        'backend/migrations/versions',
        'app/migrations/versions',
        'src/migrations/versions',
        'api/migrations/versions',
        # Attempt to find by glob pattern
        '**/migrations/versions'
    ]

    found_dirs = []

    # Check all standard paths first
    for path in possible_paths[:-1]:  # Skip the glob pattern for now
        if os.path.exists(path) and os.path.isdir(path):
            logger.info(f"Found migrations directory at {os.path.abspath(path)}")
            found_dirs.append(path)

    # If no directories found, try glob pattern
    if not found_dirs:
        try:
            # Try recursive glob for migrations/versions directories
            for path in glob.glob(possible_paths[-1], recursive=True):
                if os.path.isdir(path):
                    logger.info(f"Found migrations directory through glob at {os.path.abspath(path)}")
                    found_dirs.append(path)
        except Exception as e:
            logger.error(f"Error searching for migrations with glob: {e}")

    # Log the current directory and contents to help debugging
    logger.info(f"Current directory: {os.getcwd()}")
    try:
        logger.info(f"Directory contents: {os.listdir('.')}")
    except Exception as e:
        logger.error(f"Could not list directory contents: {e}")

    return found_dirs

def get_migration_ids():
    """Get IDs of all migration files in the migrations/versions directory."""
    try:
        migration_dirs = find_migration_dirs()
        if not migration_dirs:
            logger.error("Could not find migrations directory.")
            # As a last resort, search for any python files with alembic naming pattern
            logger.info("Searching for migration files directly...")
            migration_files = glob.glob("**/*_*.py", recursive=True)
            migration_ids = []
            for filepath in migration_files:
                filename = os.path.basename(filepath)
                if '_' in filename and not filename.startswith('__'):
                    migration_id = filename.split('_')[0]
                    if len(migration_id) == 12 and migration_id.isalnum():  # Typical alembic ID format
                        migration_ids.append(migration_id)
                        logger.info(f"Found potential migration: {migration_id} in file {filepath}")
            return migration_ids

        migration_ids = []
        for migrations_dir in migration_dirs:
            for filename in os.listdir(migrations_dir):
                if filename.endswith('.py') and not filename.startswith('__'):
                    migration_id = filename.split('_')[0]
                    migration_ids.append(migration_id)
                    logger.info(f"Found migration: {migration_id} in file {os.path.join(migrations_dir, filename)}")

        # Remove duplicates and sort
        migration_ids = sorted(list(set(migration_ids)))
        logger.info(f"Found {len(migration_ids)} unique migrations")
        return migration_ids
    except Exception as e:
        logger.error(f"Error getting migration IDs: {e}")
        return []

def create_alembic_version_table(engine):
    """Create alembic_version table if it doesn't exist."""
    try:
        # Check if alembic_version table exists
        with engine.connect() as conn:
            result = conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alembic_version')"))
            table_exists = result.scalar()

        if not table_exists:
            logger.info("Creating alembic_version table")
            with engine.connect() as conn:
                conn.execute(text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"))
                conn.execute(text("ALTER TABLE alembic_version ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)"))
                conn.commit()
            logger.info("Created alembic_version table")
        else:
            logger.info("alembic_version table already exists")

        return True
    except Exception as e:
        logger.error(f"Error creating alembic_version table: {e}")
        return False

def mark_migrations_as_applied(engine, migration_ids):
    """Mark migrations as applied in the alembic_version table."""
    try:
        # Get current version
        current_version = None
        try:
            with engine.connect() as conn:
                result = conn.execute(text("SELECT version_num FROM alembic_version"))
                row = result.fetchone()
                if row:
                    current_version = row[0]
        except ProgrammingError:
            # Table doesn't exist
            logger.warning("alembic_version table doesn't exist")
            create_alembic_version_table(engine)

        logger.info(f"Current migration version: {current_version}")

        # If there are migrations to apply
        if migration_ids:
            # Use the latest migration ID
            latest_migration = migration_ids[-1]

            with engine.connect() as conn:
                # Clear any existing entries to avoid conflicts
                conn.execute(text("DELETE FROM alembic_version"))

                # Insert the latest migration ID
                logger.info(f"Setting migration version to {latest_migration}")
                conn.execute(text(f"INSERT INTO alembic_version (version_num) VALUES ('{latest_migration}')"))
                conn.commit()

            logger.info(f"Successfully marked {len(migration_ids)} migrations as applied, up to {latest_migration}")
            return True
        else:
            # If we couldn't find any migrations but need to create a dummy version
            if not current_version:
                dummy_version = "60ebacf5d282"  # A dummy version
                logger.warning(f"No migrations found. Creating dummy version {dummy_version}")

                with engine.connect() as conn:
                    # Clear any existing entries to avoid conflicts
                    conn.execute(text("DELETE FROM alembic_version"))

                    # Insert the dummy migration ID
                    logger.info(f"Setting migration version to {dummy_version}")
                    conn.execute(text(f"INSERT INTO alembic_version (version_num) VALUES ('{dummy_version}')"))
                    conn.commit()

                logger.info(f"Successfully set dummy migration version to {dummy_version}")
                return True
            else:
                logger.warning("No migrations found to apply and version already exists")
                return False

    except Exception as e:
        logger.error(f"Error marking migrations as applied: {e}")
        return False

def check_tables(engine):
    """Check if tables exist in the database."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"))
            count = result.scalar()

            # Check for specific tables
            result = conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')"))
            users_table_exists = result.scalar()

        logger.info(f"Found {count} tables in database")
        logger.info(f"Users table exists: {users_table_exists}")

        return count > 0
    except Exception as e:
        logger.error(f"Error checking tables: {e}")
        return False

def fix_using_flask_migrate():
    """Fix migration state by using Flask-Migrate directly."""
    try:
        # Try to import required modules
        try:
            from flask import Flask
            from flask_migrate import Migrate, stamp
            from sqlalchemy import inspect
        except ImportError as e:
            logger.error(f"Required package not found: {e}")
            logger.error("Please install required packages: pip install flask flask-sqlalchemy flask-migrate")
            return False

        # Try to import app and db from the project
        try:
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            logger.info("Attempting to import application...")

            # Try different import patterns
            try:
                # First try: standard Flask app pattern
                from app import create_app, db
                logger.info("Successfully imported app and db from app package")

                app = create_app()
                logger.info("Created app instance")
            except (ImportError, AttributeError) as e:
                logger.warning(f"Could not import from app package: {e}")

                try:
                    # Second try: direct import pattern
                    from app import app, db
                    logger.info("Successfully imported app instance and db from app package")
                except (ImportError, AttributeError) as e:
                    logger.warning(f"Could not import app instance from app package: {e}")

                    try:
                        # Third try: backend structure
                        from backend.app import create_app, db
                        logger.info("Successfully imported from backend.app package")

                        app = create_app()
                        logger.info("Created app instance")
                    except (ImportError, AttributeError) as e:
                        logger.error(f"Could not import application: {e}")
                        return False

            # Fix migrations using flask-migrate
            with app.app_context():
                logger.info("Checking database tables...")

                # Check if tables exist but alembic_version doesn't
                inspector = inspect(db.engine)
                tables = inspector.get_table_names()

                logger.info(f"Existing tables: {tables}")

                if 'users' in tables and 'alembic_version' not in tables:
                    logger.info("Database has tables but no migration tracking")

                    # Initialize migration
                    migrate = Migrate(app, db)
                    logger.info("Initialized Flask-Migrate")

                    # Stamp the database with current migration head
                    logger.info("Stamping database with current head...")
                    stamp()

                    logger.info("Migration state fixed - database stamped with current head")
                    return True
                else:
                    if 'alembic_version' in tables:
                        logger.info("Migration tracking already set up (alembic_version table exists)")
                    else:
                        logger.info("Users table not found, may need different approach")
                    return False

        except Exception as e:
            logger.error(f"Error using Flask-Migrate: {e}")
            return False

    except Exception as e:
        logger.error(f"Unexpected error in fix_using_flask_migrate: {e}")
        return False

def main():
    logger.info("Starting migration fix process")

    # First try using Flask-Migrate directly, which is the cleaner approach
    if fix_using_flask_migrate():
        logger.info("Successfully fixed migrations using Flask-Migrate")
        return True

    # If that doesn't work, fall back to the manual approach
    logger.info("Falling back to manual migration fix...")

    try:
        # Create engine
        engine = create_engine(DATABASE_URL)

        # Check connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("Database connection successful")

        # Check if tables exist first
        tables_exist = check_tables(engine)
        if not tables_exist:
            logger.info("No tables found in database, nothing to fix")
            return True

        # Get migration IDs
        migration_ids = get_migration_ids()
        if not migration_ids:
            logger.warning("No migrations found, will attempt to create dummy version")

        # Create alembic_version table if needed
        if not create_alembic_version_table(engine):
            logger.error("Failed to create or verify alembic_version table")
            return False

        # Mark migrations as applied
        if mark_migrations_as_applied(engine, migration_ids):
            logger.info("Migration fix process completed successfully")
            return True
        else:
            logger.error("Failed to mark migrations as applied")
            return False

    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        logger.info("Migration fix completed successfully")
        sys.exit(0)
    else:
        logger.error("Migration fix failed")
        sys.exit(1)
