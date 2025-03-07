#!/usr/bin/env python3
"""
Emergency Fix Script for Render Deployment

This script directly fixes the database migration state to prevent
"relation already exists" errors during Flask/SQLAlchemy app deployment.

It creates the alembic_version table if it doesn't exist and sets
the migration version to avoid conflicts with existing tables.
"""

import os
import sys
import time
import logging
from datetime import datetime
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Migration ID that attempts to create tables that already exist
TARGET_MIGRATION_ID = "60ebacf5d282"

class EmergencyFix:
    """Applies emergency fix to database migration state."""

    def __init__(self, database_url=None, target_migration=None):
        """Initialize with database URL and target migration ID."""
        self.database_url = database_url or os.getenv('DATABASE_URL')
        self.target_migration = target_migration or TARGET_MIGRATION_ID
        self.connection = None
        self.cursor = None
        self.max_retries = int(os.getenv('DB_CONNECT_RETRY', '3'))
        self.success = False
        self.messages = []

    def log(self, message, level='info'):
        """Log a message with the specified level and add to messages list."""
        self.messages.append(message)
        if level == 'error':
            logger.error(message)
        elif level == 'warning':
            logger.warning(message)
        else:
            logger.info(message)

    def connect_to_database(self):
        """Connect to the database with retry logic."""
        if not self.database_url:
            self.log("No DATABASE_URL found in environment variables", 'error')
            return False

        retries = 0
        while retries < self.max_retries:
            try:
                self.log(f"Connecting to database (attempt {retries + 1}/{self.max_retries})")
                self.connection = psycopg2.connect(self.database_url)
                self.connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                self.cursor = self.connection.cursor()
                self.log("Successfully connected to database")
                return True
            except Exception as e:
                retries += 1
                if retries >= self.max_retries:
                    self.log(f"Failed to connect to database after {self.max_retries} attempts: {str(e)}", 'error')
                    return False
                self.log(f"Connection attempt {retries} failed: {str(e)}", 'warning')
                time.sleep(2)  # Wait before retrying

        return False

    def check_alembic_version_table(self):
        """Check if alembic_version table exists."""
        try:
            self.cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'alembic_version'
                );
            """)
            exists = self.cursor.fetchone()[0]
            if exists:
                self.log("alembic_version table already exists")
            else:
                self.log("alembic_version table does not exist, will create it")
            return exists
        except Exception as e:
            self.log(f"Error checking for alembic_version table: {str(e)}", 'error')
            return False

    def create_alembic_version_table(self):
        """Create the alembic_version table."""
        try:
            self.log("Creating alembic_version table...")
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS alembic_version (
                    version_num VARCHAR(32) NOT NULL,
                    PRIMARY KEY (version_num)
                );
            """)
            self.log("alembic_version table created successfully")
            return True
        except Exception as e:
            self.log(f"Error creating alembic_version table: {str(e)}", 'error')
            return False

    def set_migration_version(self):
        """Set the migration version to target migration ID."""
        try:
            # First delete any existing versions
            self.cursor.execute("DELETE FROM alembic_version;")
            self.log("Cleared existing migration versions")

            # Insert the target migration ID
            self.cursor.execute(
                "INSERT INTO alembic_version (version_num) VALUES (%s);",
                (self.target_migration,)
            )
            self.log(f"Set migration version to: {self.target_migration}")
            return True
        except Exception as e:
            self.log(f"Error setting migration version: {str(e)}", 'error')
            return False

    def verify_fix(self):
        """Verify that the fix was applied correctly."""
        try:
            self.cursor.execute("SELECT version_num FROM alembic_version;")
            versions = self.cursor.fetchall()

            if not versions:
                self.log("Verification failed: No migration versions found", 'error')
                return False

            if len(versions) > 1:
                self.log(f"Warning: Multiple migration versions found: {versions}", 'warning')

            version = versions[0][0]
            if version != self.target_migration:
                self.log(f"Verification failed: Found version {version}, expected {self.target_migration}", 'error')
                return False

            self.log(f"Verification successful: Migration version is set to {version}")
            return True
        except Exception as e:
            self.log(f"Error verifying fix: {str(e)}", 'error')
            return False

    def check_existing_tables(self):
        """Check for existing tables in the database."""
        try:
            self.cursor.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public';
            """)
            tables = [row[0] for row in self.cursor.fetchall()]

            important_tables = ['users', 'albums', 'playlists', 'tracks']
            found_tables = [table for table in important_tables if table in tables]

            if found_tables:
                self.log(f"Found existing tables: {', '.join(found_tables)}")
                return True
            else:
                self.log("No important application tables found. This fix may not be needed.", 'warning')
                return False
        except Exception as e:
            self.log(f"Error checking existing tables: {str(e)}", 'error')
            return False

    def run(self):
        """Run the emergency fix process."""
        self.log("=== STARTING EMERGENCY FIX ===")
        self.log(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        if not self.connect_to_database():
            self.log("=== FIX FAILED: Could not connect to database ===", 'error')
            return False

        try:
            # Check if we have existing tables that need protection
            self.check_existing_tables()

            # Check and create alembic_version table if needed
            if not self.check_alembic_version_table():
                if not self.create_alembic_version_table():
                    self.log("=== FIX FAILED: Could not create alembic_version table ===", 'error')
                    return False

            # Set the migration version
            if not self.set_migration_version():
                self.log("=== FIX FAILED: Could not set migration version ===", 'error')
                return False

            # Verify the fix
            if not self.verify_fix():
                self.log("=== FIX FAILED: Verification failed ===", 'error')
                return False

            self.log("=== EMERGENCY FIX COMPLETED SUCCESSFULLY ===")
            self.success = True
            return True
        except Exception as e:
            self.log(f"Unexpected error during fix: {str(e)}", 'error')
            self.log("=== FIX FAILED: Unexpected error ===", 'error')
            return False
        finally:
            self.close_connection()

    def close_connection(self):
        """Close the database connection."""
        if self.connection:
            if self.cursor:
                self.cursor.close()
            self.connection.close()
            self.log("Database connection closed")

    def print_summary(self):
        """Print a summary of the fix process."""
        print("\n" + "=" * 80)
        print("EMERGENCY FIX SUMMARY")
        print("=" * 80)

        for message in self.messages:
            print(message)

        print("\n" + "=" * 80)
        if self.success:
            print("SUCCESS: The database migration state has been fixed.")
            print("You can now restart your Render service.")
        else:
            print("ERROR: The fix could not be completed.")
            print("Please check the logs above for details and try again.")
        print("=" * 80 + "\n")

def main():
    """Main function to run the emergency fix."""
    # Allow custom migration ID from command line
    if len(sys.argv) > 1:
        migration_id = sys.argv[1]
    else:
        migration_id = TARGET_MIGRATION_ID

    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("ERROR: DATABASE_URL environment variable not found.")
        print("Please set this variable with your PostgreSQL connection string.")
        print("Example: export DATABASE_URL=postgresql://username:password@host:port/dbname")
        return 1

    # Run the fix
    fix = EmergencyFix(database_url, migration_id)
    fix.run()
    fix.print_summary()

    return 0 if fix.success else 1

if __name__ == "__main__":
    sys.exit(main())
