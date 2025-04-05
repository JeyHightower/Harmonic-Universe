#!/bin/bash

# Exit on error
set -e

echo "Starting Harmonic Universe application"
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Set environment variables
export FLASK_APP=wsgi.py
export FLASK_ENV=production
export FLASK_DEBUG=0
export PYTHONPATH=$(pwd):$PYTHONPATH

# Enhanced logging
if [ "${ENABLE_DETAILED_LOGGING}" = "true" ]; then
    echo "Detailed logging enabled"
    export PYTHONUNBUFFERED=1
    export LOG_LEVEL=DEBUG
    # Create logs directory if it doesn't exist
    mkdir -p logs
fi

# Determine the port to use
PORT="${PORT:-10000}"
echo "Application will listen on port $PORT"

# Verify static directory exists
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

# Run database health check
echo "Running database health check..."
python -c "
try:
    import os, sys
    sys.path.insert(0, os.path.abspath('.'))
    from backend.app.extensions import db
    from backend.app import create_app
    app = create_app()
    with app.app_context():
        with db.engine.connect() as conn:
            result = conn.execute(db.text('SELECT 1'))
            print('Database connection successful')
except Exception as e:
    print(f'Database connection error: {str(e)}')
    exit(1)
" || echo "Warning: Database check failed, continuing anyway"

# Run database migrations if needed
if [ -f "migrations/env.py" ]; then
    echo "Running database migrations..."
    python -m flask db upgrade || echo "Warning: Migrations failed, continuing anyway"
fi

# Start the application with gunicorn
echo "Starting application with gunicorn..."
gunicorn --workers=2 --timeout=120 --bind=0.0.0.0:$PORT --log-level ${LOG_LEVEL:-info} wsgi:app 