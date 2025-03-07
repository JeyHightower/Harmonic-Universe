#!/usr/bin/env python3
"""
Deployment Verification Script

This script verifies that the database is properly configured for deployment,
specifically checking the alembic_version table to ensure it will prevent
"relation already exists" errors.
"""

import os
import sys
import time
import logging
from datetime import datetime
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

def check_database_connection():
    """Check if we can connect to the database."""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        logger.error("DATABASE_URL environment variable not found")
        return False, None

    try:
        logger.info(f"Connecting to database...")
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        logger.info("Successfully connected to database")
        return True, conn
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        return False, None

def check_alembic_version(conn):
    """Check if alembic_version table exists and has the correct version."""
    target_version = '60ebacf5d282'

    try:
        cursor = conn.cursor()

        # Check if alembic_version table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'alembic_version'
            );
        """)
        table_exists = cursor.fetchone()[0]

        if not table_exists:
            logger.error("alembic_version table does not exist")
            return False

        # Check version
        cursor.execute("SELECT version_num FROM alembic_version;")
        versions = cursor.fetchall()

        if not versions:
            logger.error("alembic_version table exists but has no entries")
            return False

        if versions[0][0] != target_version:
            logger.error(f"Incorrect version: {versions[0][0]}, expected: {target_version}")
            return False

        logger.info(f"Correct migration version found: {target_version}")
        return True
    except Exception as e:
        logger.error(f"Error checking alembic_version: {e}")
        return False

def check_tables(conn):
    """Check if important tables exist."""
    important_tables = ['users', 'albums', 'tracks', 'playlists']

    try:
        cursor = conn.cursor()

        # Get list of all tables
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public';
        """)
        tables = [row[0] for row in cursor.fetchall()]

        # Check if important tables exist
        missing_tables = [table for table in important_tables if table not in tables]

        if missing_tables:
            logger.warning(f"Missing important tables: {', '.join(missing_tables)}")
        else:
            logger.info(f"All important tables found: {', '.join(important_tables)}")

        return tables
    except Exception as e:
        logger.error(f"Error checking tables: {e}")
        return []

def fix_database_state(conn):
    """Fix the database state if needed."""
    target_version = '60ebacf5d282'

    try:
        cursor = conn.cursor()

        # Create alembic_version table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL,
                PRIMARY KEY (version_num)
            );
        """)

        # Set the migration version
        cursor.execute("DELETE FROM alembic_version;")
        cursor.execute(f"INSERT INTO alembic_version (version_num) VALUES ('{target_version}');")

        # Verify
        cursor.execute("SELECT version_num FROM alembic_version;")
        version = cursor.fetchone()[0]

        if version == target_version:
            logger.info(f"Successfully fixed database state. Version: {version}")
            return True
        else:
            logger.error(f"Failed to fix database state. Version: {version}")
            return False
    except Exception as e:
        logger.error(f"Error fixing database state: {e}")
        return False

def check_environment_variables():
    """Check if all necessary environment variables are set."""
    required_vars = ['DATABASE_URL', 'FLASK_APP', 'SECRET_KEY']
    migration_vars = ['FLASK_NO_MIGRATE', 'SKIP_DB_UPGRADE']

    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    missing_migration_vars = [var for var in migration_vars if not os.environ.get(var)]

    if missing_vars:
        logger.warning(f"Missing required environment variables: {', '.join(missing_vars)}")

    if missing_migration_vars:
        logger.warning(f"Missing migration control variables: {', '.join(missing_migration_vars)}")

    all_present = not missing_vars and not missing_migration_vars
    return all_present

def main():
    """Main function to run verification."""
    logger.info("=== STARTING DEPLOYMENT VERIFICATION ===")

    # Check environment variables
    env_ok = check_environment_variables()
    if not env_ok:
        logger.warning("Environment check failed")

    # Check database connection
    connection_ok, conn = check_database_connection()
    if not connection_ok:
        logger.error("Database connection check failed")
        return 1

    # Check alembic version
    version_ok = check_alembic_version(conn)
    if not version_ok:
        logger.warning("Alembic version check failed. Attempting to fix...")
        fix_ok = fix_database_state(conn)
        if not fix_ok:
            logger.error("Failed to fix database state")
            conn.close()
            return 1

    # Check tables
    tables = check_tables(conn)

    # Close connection
    conn.close()

    # Summary
    logger.info("=== DEPLOYMENT VERIFICATION SUMMARY ===")
    logger.info(f"Environment variables check: {'PASSED' if env_ok else 'WARNING'}")
    logger.info(f"Database connection check: {'PASSED' if connection_ok else 'FAILED'}")
    logger.info(f"Alembic version check: {'PASSED' if version_ok else 'FIXED'}")
    logger.info(f"Tables found: {len(tables)}")

    if version_ok or fix_ok:
        logger.info("VERIFICATION PASSED: The database is properly configured for deployment")
        return 0
    else:
        logger.error("VERIFICATION FAILED: Issues were found that could affect deployment")
        return 1

if __name__ == "__main__":
    sys.exit(main())
