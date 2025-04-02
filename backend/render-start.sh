#!/bin/bash

# Exit on error
set -e

echo "Starting Harmonic Universe application at $(date)"
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Set environment variables
export FLASK_APP=app.py
export FLASK_ENV=production
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Ensure log directory exists
mkdir -p logs

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
fi

# Determine the port to use
PORT="${PORT:-10000}"
echo "Application will listen on port $PORT"

# Verify static directory
echo "Checking static directory..."
if [ -d "static" ]; then
    echo "Static directory exists"
    echo "Contents:"
    ls -la static | head -n 10
else
    echo "WARNING: Static directory not found, creating it"
    mkdir -p static
    echo "<html><body><h1>Harmonic Universe</h1><p>Static files not found.</p></body></html>" > static/index.html
fi

# Verify database connection
echo "Checking database connection..."
python -c "
import os
import sys
db_url = os.environ.get('DATABASE_URL')
if not db_url:
    print('WARNING: DATABASE_URL not set. Using SQLite.')
else:
    print(f'Database URL found: {db_url[:10]}...')
"

# Run any pending migrations
echo "Running any pending database migrations..."
if [ -f "init_migrations.py" ]; then
    export FLASK_APP=init_migrations.py
    python -m flask db upgrade || echo "Warning: Migrations failed, but continuing"
fi

# Start the application with Gunicorn
echo "Starting Gunicorn server..."

# Determine the app path
if grep -q "def create_app" app.py; then
    echo "Using app:create_app() for Gunicorn"
    APP_PATH="app:create_app()"
else
    echo "Using app:app for Gunicorn"
    APP_PATH="app:app"
fi

# Start Gunicorn
echo "Starting Gunicorn with $APP_PATH on port $PORT"
exec gunicorn "$APP_PATH" \
    --bind=0.0.0.0:$PORT \
    --workers=4 \
    --threads=2 \
    --worker-class=sync \
    --timeout=120 \
    --log-level=info \
    --access-logfile=- \
    --error-logfile=- \
    --capture-output 