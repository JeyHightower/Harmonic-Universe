#!/bin/bash

# Exit on error
set -e

echo "Starting Harmonic Universe application"
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Set environment variables
export FLASK_APP=backend.app:create_app
export FLASK_ENV=production
export FLASK_DEBUG=0

# Enhanced logging
if [ "${ENABLE_DETAILED_LOGGING}" = "true" ]; then
    echo "Detailed logging enabled"
    export PYTHONUNBUFFERED=1
    export LOG_LEVEL=DEBUG
    # Create logs directory if it doesn't exist
    mkdir -p backend/logs
fi

# Determine the port to use
PORT="${PORT:-10000}"
echo "Application will listen on port $PORT"

# Verify static directory exists
echo "Checking static directory..."
if [ -d "backend/static" ]; then
    echo "Static directory exists"
    echo "Contents:"
    ls -la backend/static | head -n 10
else
    echo "WARNING: Static directory not found, creating it"
    mkdir -p backend/static
    echo "<html><body><h1>Harmonic Universe</h1><p>Static files not found.</p></body></html>" > backend/static/index.html
fi

# Run database health check
echo "Running database health check..."
cd backend
python -c "
try:
    from app.extensions import db
    from app import create_app
    app = create_app()
    with app.app_context():
        result = db.engine.execute('SELECT 1')
        print('Database connection successful')
except Exception as e:
    print(f'Database connection error: {str(e)}')
    exit(1)
" || echo "Warning: Database check failed, continuing anyway"

# Run database migrations if needed
if [ -f "init_migrations.py" ]; then
    echo "Running database migrations..."
    python init_migrations.py || echo "Warning: Migrations failed, continuing anyway"
fi

# Start the application with gunicorn
echo "Starting application with gunicorn..."
gunicorn --workers=2 --timeout=120 --bind=0.0.0.0:$PORT --log-level ${LOG_LEVEL:-info} wsgi:app 