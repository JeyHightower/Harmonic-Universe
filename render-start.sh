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

# Run database migrations if needed
if [ -f "backend/init_migrations.py" ]; then
    echo "Running database migrations..."
    cd backend
    python init_migrations.py || echo "Warning: Migrations failed, continuing anyway"
    cd ..
fi

# Start the application with gunicorn
echo "Starting application with gunicorn..."
cd backend
gunicorn --workers=2 --timeout=120 --bind=0.0.0.0:$PORT --log-level info wsgi:app 