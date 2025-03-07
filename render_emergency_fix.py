#!/usr/bin/env python
"""
EMERGENCY DATABASE FIX

This script directly fixes the 'relation already exists' error by creating
the alembic_version table and setting it to the problematic migration.

Run this directly on your Render shell:
1. Go to Render dashboard > Your web service > Shell
2. Run: python render_emergency_fix.py
"""
import os
import sys
import logging
import psycopg2

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("emergency_fix")

# The problematic migration ID from the error message
MIGRATION_ID = '60ebacf5d282'

def emergency_fix():
    """Emergency direct database fix"""
    # Get the database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        logger.error("DATABASE_URL environment variable not set")
        return False

    logger.info(f"Starting emergency database fix for migration {MIGRATION_ID}")

    try:
        # Connect to database
        logger.info("Connecting to database...")
        conn = psycopg2.connect(database_url)
        conn.autocommit = True  # Set autocommit mode
        cur = conn.cursor()

        # Check if alembic_version table exists
        logger.info("Checking if alembic_version table exists...")
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'alembic_version'
            )
        """)
        table_exists = cur.fetchone()[0]

        if not table_exists:
            # Create the table
            logger.info("Creating alembic_version table...")
            cur.execute("""
                CREATE TABLE alembic_version (
                    version_num VARCHAR(32) NOT NULL,
                    PRIMARY KEY (version_num)
                )
            """)
            logger.info("Table created successfully")
        else:
            logger.info("alembic_version table already exists")

        # Check current version
        cur.execute("SELECT version_num FROM alembic_version")
        rows = cur.fetchall()

        if rows:
            current_version = rows[0][0]
            logger.info(f"Current version: {current_version}")

            if current_version != MIGRATION_ID:
                # Update to our target version
                logger.info(f"Updating version to {MIGRATION_ID}...")
                cur.execute("DELETE FROM alembic_version")
                cur.execute(f"INSERT INTO alembic_version (version_num) VALUES ('{MIGRATION_ID}')")
                logger.info("Version updated successfully")
            else:
                logger.info("Already set to the correct version")
        else:
            # Table exists but no rows - insert our version
            logger.info(f"No version found. Setting to {MIGRATION_ID}...")
            cur.execute(f"INSERT INTO alembic_version (version_num) VALUES ('{MIGRATION_ID}')")
            logger.info("Version set successfully")

        # Verify the fix
        cur.execute("SELECT version_num FROM alembic_version")
        version = cur.fetchone()[0]
        logger.info(f"Final version: {version}")

        # Close connection
        cur.close()
        conn.close()

        logger.info("Database fix applied successfully!")
        logger.info("Your application should now deploy without errors.")
        return True

    except Exception as e:
        logger.error(f"Error applying database fix: {e}")
        return False

if __name__ == "__main__":
    if emergency_fix():
        print("\n✅ SUCCESS: The database fix was applied successfully!")
        print("Your application should now deploy without the 'relation already exists' error.")
        print("\nNext steps:")
        print("1. Exit this shell (type 'exit')")
        print("2. Redeploy your application on Render")
        sys.exit(0)
    else:
        print("\n❌ ERROR: The database fix failed.")
        print("Please check the logs above for details.")
        sys.exit(1)
