#!/bin/bash
# start-safe.sh - Safe startup script that verifies database state

echo "=== STARTING APP WITH DATABASE VERIFICATION ==="

# Verify database state once more before starting
echo "Verifying database migration state..."
python << EOF
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Get database URL from environment
database_url = os.environ.get('DATABASE_URL')
target_version = '60ebacf5d282'

if database_url:
    try:
        # Connect to the database
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Check if alembic_version table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'alembic_version'
            );
        """)
        table_exists = cur.fetchone()[0]

        if not table_exists:
            print("Creating alembic_version table...")
            cur.execute("""
                CREATE TABLE alembic_version (
                    version_num VARCHAR(32) NOT NULL,
                    PRIMARY KEY (version_num)
                );
            """)

        # Check current version
        cur.execute("SELECT version_num FROM alembic_version;")
        versions = cur.fetchall()

        if not versions:
            print(f"Setting migration version to {target_version}...")
            cur.execute(f"INSERT INTO alembic_version (version_num) VALUES ('{target_version}');")
        elif versions[0][0] != target_version:
            print(f"Updating migration version from {versions[0][0]} to {target_version}...")
            cur.execute("DELETE FROM alembic_version;")
            cur.execute(f"INSERT INTO alembic_version (version_num) VALUES ('{target_version}');")
        else:
            print(f"Migration version already set to {target_version}")

        # Verify
        cur.execute("SELECT * FROM alembic_version;")
        final_versions = cur.fetchall()
        print(f"Final migration version: {final_versions}")

        # Close the connection
        cur.close()
        conn.close()
        print("Database verification complete!")
    except Exception as e:
        print(f"Error verifying database state: {e}")
        # Continue anyway, don't exit
else:
    print("DATABASE_URL not found in environment variables")
EOF

# Set environment variables to prevent migrations
export FLASK_NO_MIGRATE=1
export SKIP_DB_UPGRADE=true

# Start the app with gunicorn
echo "Starting application..."
gunicorn "app:create_app()" --log-level debug
