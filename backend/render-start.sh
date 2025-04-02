#!/bin/bash

# Exit on error
set -e

echo "Starting Harmonic Universe application at $(date -u)"
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Set environment variables
export FLASK_APP=app.py
export FLASK_ENV=production
export PYTHONPATH=$PYTHONPATH:$(pwd):/opt/render/project/src

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
if [ -n "$DATABASE_URL" ]; then
    echo "Database URL found: ${DATABASE_URL:0:10}..."
    
    # Run any pending migrations
    echo "Running any pending database migrations..."
    if [ -f "init_migrations.py" ]; then
        export FLASK_APP=init_migrations.py
        python -m flask db upgrade || echo "Warning: Migrations failed, but continuing"
    fi
else
    echo "WARNING: No DATABASE_URL found. Using SQLite."
fi

# Start the application with Gunicorn
echo "Starting Gunicorn server..."

# First try with direct app reference
echo "Using app:app for Gunicorn"
if gunicorn --bind 0.0.0.0:$PORT app:app; then
    exit 0
fi

# If that fails, try with create_app factory
echo "Direct app:app failed, trying app:create_app()"
if gunicorn --bind 0.0.0.0:$PORT "app:create_app()"; then
    exit 0
fi

# If that fails, try with backend.app module (from project root)
echo "Local app module failed, trying backend.app module"
cd /opt/render/project/src || cd ../..
echo "Now in $(pwd)"
if [ -f "backend/app.py" ]; then
    echo "Found backend/app.py, using backend.app:app"
    gunicorn --bind 0.0.0.0:$PORT backend.app:app
else
    echo "ERROR: backend/app.py not found in $(pwd)"
    find . -name app.py | head -5
    
    # Last resort - try to find any Flask app
    echo "Searching for any Flask app..."
    FLASK_FILES=$(find . -name "*.py" | xargs grep -l "Flask(" | head -1)
    if [ -n "$FLASK_FILES" ]; then
        echo "Found Flask app in: $FLASK_FILES"
        MODULE_PATH=$(echo $FLASK_FILES | sed 's/\.\///g' | sed 's/\.py//g' | sed 's/\//\./g')
        echo "Using $MODULE_PATH:app"
        gunicorn --bind 0.0.0.0:$PORT "$MODULE_PATH:app"
    else
        echo "FATAL: Could not find any Flask application!"
        exit 1
    fi
fi 