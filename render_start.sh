#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

echo "=== HARMONIC UNIVERSE STARTUP SCRIPT ==="

# Set up environment variables
export PYTHONUNBUFFERED=true  # Prevent Python from buffering stdout and stderr

echo "Setting up environment..."

# Check if gunicorn is installed and available
if ! python -m pip show gunicorn > /dev/null 2>&1; then
  echo "ERROR: Gunicorn not found, installing..."
  python -m pip install gunicorn==21.2.0
fi

echo "Python path before modifications:"
python -c "import sys; print(sys.path)"

echo "Checking gunicorn location:"
which gunicorn || echo "gunicorn not found in PATH"

echo "Gunicorn package info:"
python -m pip show gunicorn

echo "Starting application server..."

# List files in key directories to help debugging
echo "Files in current directory:"
ls -la

# First determine where our Flask app is located
FLASK_APP=""
FLASK_APP_DIR=""
GUNICORN_APP=""

if [ -d "backend" ] && [ -f "backend/app/__init__.py" ]; then
  echo "Found Flask app in backend/app"
  FLASK_APP="app.main:app"
  FLASK_APP_DIR="backend"
  GUNICORN_APP="app.main:app"
elif [ -d "backend" ] && [ -f "backend/main.py" ]; then
  echo "Found Flask app in backend/main.py"
  FLASK_APP="main:app"
  FLASK_APP_DIR="backend"
  GUNICORN_APP="main:app"
elif [ -d "backend" ] && [ -f "backend/app.py" ]; then
  echo "Found Flask app in backend/app.py"
  FLASK_APP="app:app"
  FLASK_APP_DIR="backend"
  GUNICORN_APP="app:app"
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then
  echo "Found Flask app in app"
  FLASK_APP="app.main:app"
  FLASK_APP_DIR="."
  GUNICORN_APP="app.main:app"
elif [ -f "app.py" ]; then
  echo "Found Flask app in app.py"
  FLASK_APP="app:app"
  FLASK_APP_DIR="."
  GUNICORN_APP="app:app"
else
  echo "WARNING: Could not locate Flask app"
  echo "Tried looking in: backend/app, backend/main.py, backend/app.py, app/, and app.py"
  echo "Will use default: app.main:app in backend/"
  FLASK_APP="app.main:app"
  FLASK_APP_DIR="backend"
  GUNICORN_APP="app.main:app"
fi

echo "Using Flask app: $FLASK_APP in directory: $FLASK_APP_DIR"

# Navigate to the Flask app directory
cd $FLASK_APP_DIR
echo "Working directory: $(pwd)"

# Set environment variables for Flask
export FLASK_APP=$FLASK_APP
export PYTHONPATH=$PYTHONPATH:$(pwd)

echo "Final environment:"
echo "PYTHONPATH: $PYTHONPATH"
echo "FLASK_APP: $FLASK_APP"
echo "Working directory: $(pwd)"

# List files again after changing directory
echo "Files in application directory:"
ls -la

# Check if our target app file exists
python -c "import importlib.util; print('App module can be imported:' if importlib.util.find_spec('$GUNICORN_APP'.split(':')[0].replace('.', '/')) else 'App module NOT FOUND')" || echo "Error checking module"

echo "Python path after modifications:"
python -c "import sys; print(sys.path)"

echo "Starting Gunicorn with app: $GUNICORN_APP"

# Check if tables exist but alembic_version doesn't
echo "Checking database state..."
python -c "
import os
from sqlalchemy import create_engine, inspect, text
import psycopg2

# The specific problematic migration ID from the error message
MIGRATION_ID = '60ebacf5d282'

database_url = os.environ.get('DATABASE_URL')
if not database_url:
    print('DATABASE_URL not found')
    exit(1)

try:
    engine = create_engine(database_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    print(f'Existing tables: {tables}')

    if 'users' in tables:
        alembic_exists = 'alembic_version' in tables

        if not alembic_exists:
            print('Creating alembic_version table...')
            with engine.connect() as conn:
                conn.execute(text('CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) PRIMARY KEY)'))
                conn.execute(text(f\"\"\"
                INSERT INTO alembic_version (version_num)
                VALUES ('{MIGRATION_ID}')
                ON CONFLICT (version_num) DO NOTHING
                \"\"\"))
                conn.commit()
                print(f'Database stamped with migration ID: {MIGRATION_ID}')
        else:
            # Check if a specific migration needs to be set
            with engine.connect() as conn:
                result = conn.execute(text('SELECT version_num FROM alembic_version'))
                rows = result.fetchall()
                if rows:
                    print(f'Current migration version: {rows[0][0]}')
                    if rows[0][0] != MIGRATION_ID:
                        print(f'Updating migration version to {MIGRATION_ID}...')
                        conn.execute(text('DELETE FROM alembic_version'))
                        conn.execute(text(f\"\"\"
                        INSERT INTO alembic_version (version_num)
                        VALUES ('{MIGRATION_ID}')
                        \"\"\"))
                        conn.commit()
                        print('Migration version updated')
                else:
                    print('No migration version found, setting one...')
                    conn.execute(text(f\"\"\"
                    INSERT INTO alembic_version (version_num)
                    VALUES ('{MIGRATION_ID}')
                    \"\"\"))
                    conn.commit()
                    print(f'Migration version set to {MIGRATION_ID}')
except Exception as e:
    print(f'Error checking database: {e}')
    # Continue anyway - we don't want to fail the build
"

# Use right FLASK_APP based on location
if [ -f "app/main.py" ]; then
    export FLASK_APP=app.main:app
elif [ -f "wsgi.py" ]; then
    export FLASK_APP=wsgi:app
fi

echo "FLASK_APP set to: $FLASK_APP"

# Now proceed with normal startup
echo "Starting application..."
if [ -n "$PORT" ]; then
    echo "Using PORT: $PORT"
    gunicorn --bind 0.0.0.0:$PORT $FLASK_APP
else
    echo "No PORT specified, using default 8000"
    gunicorn --bind 0.0.0.0:8000 $FLASK_APP
fi
