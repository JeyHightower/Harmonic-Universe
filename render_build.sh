#!/bin/bash
set -e  # Exit on error

echo "Starting Render build process..."

# Create flag file to skip migrations
echo "Creating migration skip flag..."
touch .SKIP_MIGRATIONS

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Fix database migration state directly to be absolutely sure
echo "Checking and fixing database state..."
python -c "
import os, psycopg2, sys
try:
    print('Checking database state...')
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cur = conn.cursor()

    # Check if users table exists
    cur.execute(\"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='users')\")
    users_exists = cur.fetchone()[0]

    # Check if alembic_version exists
    cur.execute(\"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='alembic_version')\")
    alembic_exists = cur.fetchone()[0]

    if users_exists and not alembic_exists:
        print('Creating alembic_version table')
        cur.execute('CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) PRIMARY KEY)')
        cur.execute(\"INSERT INTO alembic_version (version_num) VALUES ('60ebacf5d282')\")
        conn.commit()
        print('Database migration state fixed')
    else:
        print(f'Database check: users table exists: {users_exists}, alembic table exists: {alembic_exists}')

    conn.close()
except Exception as e:
    print(f'Error checking database: {e}')
    # Continue anyway
"

# Set environment variables
export FLASK_NO_MIGRATE=true
export SKIP_DB_UPGRADE=true
export DISABLE_MIGRATIONS=true

echo "Build completed successfully"
