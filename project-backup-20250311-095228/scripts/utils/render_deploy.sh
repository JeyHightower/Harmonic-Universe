#!/bin/bash
# render_deploy.sh - Safe deployment script for Render

set -e  # Exit on error

echo "===== Harmonic Universe Deployment Script ====="
echo "Date: $(date)"
echo "Current directory: $(pwd)"

# Make sure we have DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set."
    exit 1
fi

# Make scripts executable
echo "Making scripts executable..."
chmod +x fix_migrations.py
chmod +x start-gunicorn.sh
chmod +x render-build.sh

# Install required packages for database handling
echo "Installing required packages..."
pip install sqlalchemy psycopg2-binary

# Check if the database exists and has tables
echo "Checking database status..."
python -c "
import os, sys, psycopg2
try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor()
    cursor.execute(\"\"\"
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'public'
    \"\"\")
    count = cursor.fetchone()[0]
    print(f'Found {count} tables in database')

    # Check for alembic_version
    cursor.execute(\"\"\"
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'alembic_version'
        )
    \"\"\")
    alembic_exists = cursor.fetchone()[0]
    print(f'Alembic version table exists: {alembic_exists}')

    # Check for specific tables
    cursor.execute(\"\"\"
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'users'
        )
    \"\"\")
    users_exists = cursor.fetchone()[0]
    print(f'Users table exists: {users_exists}')

    cursor.close()
    conn.close()

    # If tables exist but no alembic_version, we need to fix migrations
    if count > 0 and not alembic_exists:
        sys.exit(42)  # Special code for fix needed
    elif count == 0:
        sys.exit(0)   # No tables, normal migrations
    else:
        sys.exit(1)   # Tables exist, normal operation
except Exception as e:
    print(f'Error checking database: {e}')
    sys.exit(2)  # Error
"

# Store the exit code
DB_STATUS=$?

echo "Database status check result: $DB_STATUS"

if [ $DB_STATUS -eq 42 ]; then
    echo "Tables exist but no alembic_version table found. Running migration fix script..."
    python fix_migrations.py
    if [ $? -ne 0 ]; then
        echo "WARNING: Migration fix script failed. Continuing anyway..."
    fi
elif [ $DB_STATUS -eq 0 ]; then
    echo "No database tables found. Will run migrations normally."
elif [ $DB_STATUS -eq 1 ]; then
    echo "Database tables and alembic_version exist. Normal operation."
else
    echo "WARNING: Error checking database. Will try to run normally."
fi

# Start the application
echo "Starting application..."
exec ./start-gunicorn.sh
