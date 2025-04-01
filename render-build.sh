#!/bin/bash

# Exit on error
set -e

# Display diagnostic information
echo "Starting build process at $(date)"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
python --version

# Set Python version explicitly
export PYTHON_VERSION=3.11.0

# Set Node memory limit to prevent OOM issues
export NODE_OPTIONS="--max-old-space-size=2048"

# Build Frontend
echo "==== Building frontend ===="
cd frontend
echo "Installing frontend dependencies..."
npm ci --no-audit --no-fund --prefer-offline

# Clean up unnecessary files to reduce memory usage
rm -rf node_modules/.cache

echo "Building frontend production assets..."
npm run build

# Clean up node_modules after build to free memory
rm -rf node_modules
cd ..

# Build Backend
echo "==== Building backend ===="
cd backend

# Prepare directories
echo "Creating necessary directories..."
mkdir -p instance
mkdir -p logs

# Check if Poetry is installed, if not use pip
if command -v poetry &> /dev/null; then
    echo "Using Poetry for dependency management..."
    # Install Poetry packages
    poetry config virtualenvs.create true
    poetry config virtualenvs.in-project true
    poetry install --only main --no-root

    # Create a .env file if it doesn't exist
    if [ ! -f .env ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
    fi
else
    echo "Poetry not found, using pip instead..."
    # Create and activate virtual environment
    python -m venv .venv
    source .venv/bin/activate
    
    # Install dependencies
    echo "Installing dependencies with pip..."
    pip install --upgrade pip
    pip install --no-cache-dir -r requirements.txt
    pip install --no-cache-dir gunicorn eventlet
fi

# Validate DATABASE_URL
echo "Validating DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    echo "Warning: DATABASE_URL is not set. Using SQLite as fallback."
    # Ensure app.db exists
    touch app.db
else
    # Fix Postgres URL format if needed
    if [[ $DATABASE_URL == postgres://* ]]; then
        export DATABASE_URL="${DATABASE_URL/postgres:///postgresql://}"
        echo "Fixed DATABASE_URL format for PostgreSQL"
    fi
    
    echo "Waiting for database to be ready..."
    sleep 5
fi

# Activate the virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Run migrations with error handling
echo "Running database migrations..."
if python -m flask db upgrade; then
    echo "Database migrations completed successfully"
else
    echo "Warning: Database migrations failed. Will attempt to initialize DB on startup."
fi

# Set up environment variables
echo "Setting up environment variables..."
export FLASK_APP=app.py
export FLASK_ENV=production
export FLASK_DEBUG=0
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Copy frontend build to backend static directory if necessary
echo "Copying frontend build to backend static directory..."
mkdir -p static
cp -r ../frontend/dist/* static/

echo "Build completed successfully at $(date)"
exit 0 