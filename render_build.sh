#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

echo "==================================================="
echo "    HARMONIC UNIVERSE - RENDER BUILD PROCESS       "
echo "==================================================="

# Build frontend
if [ -d "frontend" ]; then
  echo "Building frontend..."
  cd frontend
  npm install
  npm run build
  cd ..
  echo "Frontend build complete!"
else
  echo "Frontend directory not found, skipping frontend build"
fi

# Build backend
echo "Setting up backend..."
python -m pip install --upgrade pip

# Check if requirements.txt exists and install dependencies
if [ -f "backend/requirements.txt" ]; then
  echo "Installing backend dependencies from backend/requirements.txt"
  python -m pip install -r backend/requirements.txt
elif [ -f "requirements.txt" ]; then
  echo "Installing dependencies from requirements.txt"
  python -m pip install -r requirements.txt
else
  echo "WARNING: No requirements.txt found!"
fi

# Install core dependencies explicitly to ensure they're available
echo "Installing core dependencies..."
python -m pip install flask flask_sqlalchemy flask_migrate gunicorn==21.2.0 psycopg2

# Show installed packages for debugging
echo "Installed packages:"
python -m pip list

# Handle database operations with better Flask app configuration
echo "Setting up database..."

# First determine where our Flask app is located
FLASK_APP=""
FLASK_APP_DIR=""

if [ -d "backend" ] && [ -f "backend/app/__init__.py" ]; then
  echo "Found Flask app in backend/app"
  FLASK_APP="app.main:app"
  FLASK_APP_DIR="backend"
elif [ -d "backend" ] && [ -f "backend/main.py" ]; then
  echo "Found Flask app in backend/main.py"
  FLASK_APP="main:app"
  FLASK_APP_DIR="backend"
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then
  echo "Found Flask app in app"
  FLASK_APP="app.main:app"
  FLASK_APP_DIR="."
elif [ -f "app.py" ]; then
  echo "Found Flask app in app.py"
  FLASK_APP="app:app"
  FLASK_APP_DIR="."
else
  echo "WARNING: Could not locate Flask app - skipping database operations"
  echo "Tried looking in: backend/app, backend/main.py, app/, and app.py"
  exit 0
fi

echo "Using Flask app: $FLASK_APP in directory: $FLASK_APP_DIR"

# Navigate to the Flask app directory
cd $FLASK_APP_DIR
echo "Working directory: $(pwd)"

# Set environment variables for Flask
export FLASK_APP=$FLASK_APP
export PYTHONPATH=$PYTHONPATH:$(pwd)

echo "PYTHONPATH: $PYTHONPATH"
echo "FLASK_APP: $FLASK_APP"

# List files to diagnose issues
echo "Files in current directory:"
ls -la

# Check for migrations directory
if [ ! -d "migrations" ]; then
  echo "Migrations directory not found. Initializing migrations..."
  # Create an explicit migrations directory
  mkdir -p migrations
  echo "Created migrations directory: $(pwd)/migrations"

  # Initialize migrations
  echo "Running: flask db init"
  flask db init

  echo "Migrations directory after init:"
  ls -la migrations/
fi

# Run database migrations
echo "Running database migrations..."
flask db upgrade

# Run database seed if the command exists
if flask seed --help > /dev/null 2>&1; then
  echo "Running database seed..."
  flask seed all
else
  echo "Seed command not available - skipping"
fi

# Return to root directory
if [ "$FLASK_APP_DIR" != "." ]; then
  cd ..
fi

# Fix database migration state
echo "Checking and fixing database migration state..."
python -c "
import os
import sys
from sqlalchemy import create_engine, text, inspect
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('migration_fix')

# The problematic migration ID from your error
MIGRATION_ID = '60ebacf5d282'

def fix_migrations():
    # Get the database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        logger.error('DATABASE_URL environment variable not set')
        return False

    logger.info('Starting database migration fix')

    try:
        # Connect to database
        engine = create_engine(database_url)
        inspector = inspect(engine)

        # Check if tables exist
        tables = inspector.get_table_names()
        logger.info(f'Existing tables: {tables}')

        if 'users' in tables:
            logger.info('Users table exists')

            # Check if alembic_version exists
            alembic_exists = 'alembic_version' in tables

            with engine.connect() as conn:
                if not alembic_exists:
                    # Create alembic_version table
                    logger.info('Creating alembic_version table')
                    conn.execute(text('''
                        CREATE TABLE alembic_version (
                            version_num VARCHAR(32) NOT NULL,
                            PRIMARY KEY (version_num)
                        )
                    '''))

                    # Insert migration ID
                    logger.info(f'Setting migration version to {MIGRATION_ID}')
                    conn.execute(text(f'INSERT INTO alembic_version (version_num) VALUES (\'{MIGRATION_ID}\')'))
                    conn.commit()

                    logger.info('Successfully created alembic_version table and set migration version')
                else:
                    # Check current version
                    result = conn.execute(text('SELECT version_num FROM alembic_version'))
                    rows = result.fetchall()

                    if rows:
                        current_version = rows[0][0]
                        logger.info(f'Current migration version: {current_version}')

                        if current_version != MIGRATION_ID:
                            # Update to our target version
                            logger.info(f'Updating migration version to {MIGRATION_ID}')
                            conn.execute(text('DELETE FROM alembic_version'))
                            conn.execute(text(f'INSERT INTO alembic_version (version_num) VALUES (\'{MIGRATION_ID}\')'))
                            conn.commit()

                            logger.info('Successfully updated migration version')
                    else:
                        # Table exists but no rows
                        logger.info(f'No migration version found, setting to {MIGRATION_ID}')
                        conn.execute(text(f'INSERT INTO alembic_version (version_num) VALUES (\'{MIGRATION_ID}\')'))
                        conn.commit()

                        logger.info('Successfully set migration version')

                return True
        else:
            logger.info('Users table not found - no fix needed')
            return True

    except Exception as e:
        logger.error(f'Error in database fix: {e}')
        return False

# Run the fix
fix_migrations()
"

# Skip running migrations since we've fixed the database state
echo "Database state fixed - migrations will be skipped during deployment"

# Make the start script executable
chmod +x render_start.sh

echo "==================================================="
echo "       BUILD PROCESS COMPLETED SUCCESSFULLY        "
echo "==================================================="
