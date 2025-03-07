#!/usr/bin/env python
"""
Fix migration issues when tables exist but migrations haven't been applied.
This script:
1. Checks if tables exist in the database
2. If tables exist but migrations haven't been applied, stamps the database with the current migration
3. Otherwise, does nothing and lets normal migrations proceed
"""
import os
import sys
import logging
from sqlalchemy import inspect, create_engine, text
from alembic.config import Config
from alembic import command

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fix_migrations")

def check_table_exists(engine, table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def check_alembic_version_exists(engine):
    """Check if the alembic_version table exists"""
    return check_table_exists(engine, 'alembic_version')

def get_current_migration_revision():
    """Get the most recent migration revision from the versions directory"""
    try:
        # Get the alembic directory path
        alembic_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'alembic')
        versions_dir = os.path.join(alembic_dir, 'versions')

        # List all migration files
        migration_files = [f for f in os.listdir(versions_dir) if f.endswith('.py')]

        if not migration_files:
            logger.warning("No migration files found!")
            return None

        # Get the most recent migration file based on filename (assumes proper naming convention)
        latest_migration = sorted(migration_files)[-1]

        # Extract revision ID from filename
        revision_id = latest_migration.split('_')[0]
        logger.info(f"Latest migration revision: {revision_id}")
        return revision_id

    except Exception as e:
        logger.error(f"Error getting current migration revision: {e}")
        return None

def fix_migrations():
    """Main function to fix migration issues"""
    try:
        # Get database URL from environment or use a default for local development
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            logger.error("DATABASE_URL environment variable not set")
            return False

        # Create engine with the database URL
        engine = create_engine(database_url)

        # Check if core tables exist but alembic_version doesn't
        users_table_exists = check_table_exists(engine, 'users')
        alembic_version_exists = check_alembic_version_exists(engine)

        if users_table_exists and not alembic_version_exists:
            logger.info("Found existing tables but no migration history. Stamping database...")

            # Get the latest migration revision
            revision = get_current_migration_revision()
            if not revision:
                logger.error("Could not determine migration revision to stamp with")
                return False

            # Create Alembic config
            alembic_cfg = Config(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'alembic.ini'))

            # Stamp the database with the current revision
            command.stamp(alembic_cfg, revision)
            logger.info(f"Successfully stamped database with revision {revision}")
            return True

        elif users_table_exists and alembic_version_exists:
            logger.info("Database already has tables and migration history. No fix needed.")
            return True

        else:
            logger.info("No existing tables found or normal migration state. Let regular migrations proceed.")
            return True

    except Exception as e:
        logger.error(f"Error in fix_migrations: {e}")
        return False

if __name__ == "__main__":
    success = fix_migrations()
    if success:
        logger.info("Migration fix completed successfully")
        sys.exit(0)
    else:
        logger.error("Migration fix failed")
        sys.exit(1)
