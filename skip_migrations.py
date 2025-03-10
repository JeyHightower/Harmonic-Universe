#!/usr/bin/env python
"""
Helper script to mark specific migrations as completed.
Useful when certain migrations are causing problems but have already been applied manually.
"""
import os
import sys
import logging
from sqlalchemy import create_engine, text
from alembic.config import Config
from alembic import command
from flask_migrate import current

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("skip_migrations")

def skip_problematic_migration(migration_id):
    """
    Mark a specific migration as completed without running it.

    Args:
        migration_id: The revision ID of the migration to skip

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get database URL from environment
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            logger.error("DATABASE_URL environment variable not set")
            return False

        # Create engine and connection
        engine = create_engine(database_url)

        # Check if the migration exists in alembic_version table
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT EXISTS(SELECT 1 FROM alembic_version WHERE version_num = :version)"
            ).bindparams(version=migration_id))
            exists = result.scalar()

            if exists:
                logger.info(f"Migration {migration_id} is already marked as applied")
                return True

            # Otherwise, insert the migration ID
            logger.info(f"Marking migration {migration_id} as applied without running it")
            conn.execute(text(
                "INSERT INTO alembic_version (version_num) VALUES (:version)"
            ).bindparams(version=migration_id))
            conn.commit()

            logger.info(f"Successfully marked migration {migration_id} as applied")
            return True

    except Exception as e:
        logger.error(f"Error skipping migration {migration_id}: {e}")
        return False

def skip_initial_migration():
    """Skip the initial migration that creates tables (60ebacf5d282)"""
    return skip_problematic_migration("60ebacf5d282")

if __name__ == "__main__":
    # If a specific migration ID is provided as an argument, skip that one
    if len(sys.argv) > 1:
        migration_id = sys.argv[1]
        success = skip_problematic_migration(migration_id)
    else:
        # Otherwise, skip the problematic initial migration by default
        success = skip_initial_migration()

    if success:
        logger.info("Migration skip completed successfully")
        sys.exit(0)
    else:
        logger.error("Migration skip failed")
        sys.exit(1)
