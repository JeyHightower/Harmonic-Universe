#!/usr/bin/env python
"""
DIRECT DATABASE MIGRATION FIX

This script directly fixes the 'relation already exists' errors by:
1. Creating the alembic_version table if it doesn't exist
2. Setting the version to the problematic migration ID
3. Doing this with direct SQL commands for maximum reliability

Place this file in your backend directory and run it directly before migrations.
"""
import os
import sys
import logging
import psycopg2
from psycopg2 import sql

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("render_migration_fix")

# The problematic migration ID from the error message
TARGET_MIGRATION_ID = "60ebacf5d282"

def execute_sql(conn, query, params=None):
    """Execute SQL with proper error handling"""
    try:
        with conn.cursor() as cur:
            if params:
                cur.execute(query, params)
            else:
                cur.execute(query)
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        logger.error(f"SQL Error: {e}")
        return False

def fix_migrations():
    """Apply the migration fix directly to the database"""
    # Get the database URL from environment
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        logger.error("DATABASE_URL environment variable not set")
        return False

    logger.info(f"Starting direct migration fix for migration {TARGET_MIGRATION_ID}")

    try:
        # Connect to database
        logger.info("Connecting to database...")
        conn = psycopg2.connect(database_url)

        # Check if the users table exists
        logger.info("Checking if users table exists...")
        users_exists_query = """
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'users'
            );
        """
        with conn.cursor() as cur:
            cur.execute(users_exists_query)
            users_table_exists = cur.fetchone()[0]

        if not users_table_exists:
            logger.info("Users table does not exist - no fix needed")
            return True

        logger.info("Users table exists - checking alembic_version table...")

        # Check if alembic_version table exists
        alembic_exists_query = """
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'alembic_version'
            );
        """
        with conn.cursor() as cur:
            cur.execute(alembic_exists_query)
            alembic_version_exists = cur.fetchone()[0]

        if not alembic_version_exists:
            # Create the alembic_version table
            logger.info("Creating alembic_version table...")
            create_table_query = """
                CREATE TABLE alembic_version (
                    version_num VARCHAR(32) NOT NULL,
                    PRIMARY KEY (version_num)
                );
            """
            if not execute_sql(conn, create_table_query):
                logger.error("Failed to create alembic_version table")
                return False

            # Insert the target migration ID
            logger.info(f"Setting migration version to {TARGET_MIGRATION_ID}...")
            insert_query = """
                INSERT INTO alembic_version (version_num) VALUES (%s);
            """
            if not execute_sql(conn, insert_query, (TARGET_MIGRATION_ID,)):
                logger.error("Failed to insert migration version")
                return False

            logger.info("Successfully created and set alembic_version")
            return True
        else:
            # Check if a version is already set
            logger.info("Checking current migration version...")
            version_query = "SELECT version_num FROM alembic_version;"
            with conn.cursor() as cur:
                cur.execute(version_query)
                rows = cur.fetchall()

            if rows:
                current_version = rows[0][0]
                logger.info(f"Current migration version: {current_version}")

                if current_version != TARGET_MIGRATION_ID:
                    # Update to our target version
                    logger.info(f"Updating migration version to {TARGET_MIGRATION_ID}...")
                    update_query = """
                        UPDATE alembic_version SET version_num = %s;
                    """
                    if not execute_sql(conn, update_query, (TARGET_MIGRATION_ID,)):
                        logger.error("Failed to update migration version")
                        return False

                    logger.info("Successfully updated migration version")
                else:
                    logger.info("Migration version is already correct")

                return True
            else:
                # Table exists but no version - insert our target version
                logger.info(f"No version found. Setting to {TARGET_MIGRATION_ID}...")
                insert_query = """
                    INSERT INTO alembic_version (version_num) VALUES (%s);
                """
                if not execute_sql(conn, insert_query, (TARGET_MIGRATION_ID,)):
                    logger.error("Failed to insert migration version")
                    return False

                logger.info("Successfully set migration version")
                return True

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    success = fix_migrations()
    if success:
        logger.info("Migration fix completed successfully")
        sys.exit(0)
    else:
        logger.error("Migration fix failed")
        sys.exit(1)
