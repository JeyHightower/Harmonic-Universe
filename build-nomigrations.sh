#!/bin/bash
# build-nomigrations.sh - Build script that skips database migrations

echo "=== STARTING CUSTOM BUILD WITHOUT MIGRATIONS ==="

# Install Python dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create alembic_version table directly (failsafe)
echo "Setting up database migration state..."
python << EOF
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Get database URL from environment
database_url = os.environ.get('DATABASE_URL')

if database_url:
    try:
        # Connect to the database
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Create alembic_version table if it doesn't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL,
                PRIMARY KEY (version_num)
            );
        """)

        # Set the migration version to skip problematic migration
        cur.execute("DELETE FROM alembic_version;")
        cur.execute("INSERT INTO alembic_version (version_num) VALUES ('60ebacf5d282');")

        # Verify the result
        cur.execute("SELECT * FROM alembic_version;")
        versions = cur.fetchall()
        print(f"Migration version set to: {versions}")

        # Close the connection
        cur.close()
        conn.close()
        print("Database migration state fixed successfully!")
    except Exception as e:
        print(f"Error fixing database state: {e}")
else:
    print("DATABASE_URL not found in environment variables")
EOF

echo "=== BUILD COMPLETE ==="
