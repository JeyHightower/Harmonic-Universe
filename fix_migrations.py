#!/usr/bin/env python
"""
Fix migrations script - marks migrations as complete without running them.
Use this when your tables already exist but the migration history doesn't reflect it.
"""
import os
import sys
import logging
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError, ProgrammingError

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    logger.error("DATABASE_URL environment variable not set")
    sys.exit(1)

logger.info(f"Using database URL: {DATABASE_URL.replace(DATABASE_URL.split('@')[0], '***')}")

def get_migration_ids():
    """Get IDs of all migration files in the migrations/versions directory."""
    try:
        # Check for backend/migrations path
        migrations_dir = os.path.join('backend', 'migrations', 'versions')
        if not os.path.exists(migrations_dir):
            # Check for migrations path in root
            migrations_dir = os.path.join('migrations', 'versions')
            if not os.path.exists(migrations_dir):
                logger.error(f"Could not find migrations directory. Checked: backend/migrations/versions and migrations/versions")
                return []

        migration_ids = []
        for filename in os.listdir(migrations_dir):
            if filename.endswith('.py') and not filename.startswith('__'):
                migration_id = filename.split('_')[0]
                migration_ids.append(migration_id)
                logger.info(f"Found migration: {migration_id} in file {filename}")

        return migration_ids
    except Exception as e:
        logger.error(f"Error getting migration IDs: {e}")
        return []

def create_alembic_version_table(engine):
    """Create alembic_version table if it doesn't exist."""
    try:
        # Check if alembic_version table exists
        with engine.connect() as conn:
            result = conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'alembic_version')"))
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
                # If we already have a version, update it
                if current_version:
                    logger.info(f"Updating migration version from {current_version} to {latest_migration}")
                    conn.execute(text(f"UPDATE alembic_version SET version_num = '{latest_migration}'"))
                else:
                    # Otherwise insert it
                    logger.info(f"Setting initial migration version to {latest_migration}")
                    conn.execute(text(f"INSERT INTO alembic_version (version_num) VALUES ('{latest_migration}')"))
                conn.commit()

            logger.info(f"Successfully marked {len(migration_ids)} migrations as applied, up to {latest_migration}")
            return True
        else:
            logger.warning("No migrations found to apply")
            return False

    except Exception as e:
        logger.error(f"Error marking migrations as applied: {e}")
        return False

def main():
    logger.info("Starting migration fix process")

    try:
        # Create engine
        engine = create_engine(DATABASE_URL)

        # Check connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("Database connection successful")

        # Get migration IDs
        migration_ids = get_migration_ids()
        if not migration_ids:
            logger.error("No migrations found")
            return False

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
