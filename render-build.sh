#!/bin/bash

# Exit on error
set -e

echo "Starting build process..."

# Set Python version explicitly
export PYTHON_VERSION=3.11.0

# Add Poetry binary to PATH
export PATH="/opt/render/project/poetry/bin:$PATH"

# Build Frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Build Backend
echo "Building backend..."
cd backend

# Install production dependencies only (using new syntax)
echo "Installing dependencies with Poetry..."
poetry config virtualenvs.create true
poetry config virtualenvs.in-project true
poetry install --only main --no-root

# Create instance directory if it doesn't exist
mkdir -p instance

# Validate DATABASE_URL
echo "Validating DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL is not set"
    exit 1
fi

if [ "$DATABASE_URL" = "<your-postgres-database-url>" ]; then
    echo "Error: DATABASE_URL is not properly configured. Please set a valid database URL in your environment variables."
    exit 1
fi

# Fix Postgres URL format if needed
echo "Checking PostgreSQL URL format..."
if [[ $DATABASE_URL == postgres://* ]]; then
    export DATABASE_URL="${DATABASE_URL/postgres:///postgresql://}"
    echo "Fixed DATABASE_URL format for PostgreSQL"
fi

# Run database migrations
echo "Running database migrations..."
# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Activate the virtual environment
source .venv/bin/activate

# Run migrations with error handling
if poetry run flask db upgrade; then
    echo "Database migrations completed successfully"
else
    echo "Error: Database migrations failed"
    echo "Please check your DATABASE_URL configuration and ensure the database is accessible"
    exit 1
fi

# Set up environment variables
echo "Setting up environment variables..."
export FLASK_APP=app.py
export FLASK_ENV=production
export FLASK_DEBUG=0
export PYTHONPATH=$PYTHONPATH:$(pwd)

echo "Build completed successfully!" 