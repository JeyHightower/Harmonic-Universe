#!/bin/bash

# Exit on error
set -e

# Set Python version explicitly
export PYTHON_VERSION=3.11.0

# Add Poetry binary to PATH
export PATH="/opt/render/project/poetry/bin:$PATH"

# Navigate to backend directory
cd backend

# Install production dependencies only (using new syntax)
echo "Installing dependencies with Poetry..."
poetry config virtualenvs.create true
poetry config virtualenvs.in-project true
poetry install --only main --no-root

# Create instance directory if it doesn't exist
mkdir -p instance

# Run database migrations
echo "Running database migrations..."
# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Fix Postgres URL format if needed
python -c "
import os
db_url = os.environ.get('DATABASE_URL', '')
if db_url.startswith('postgres://'):
    os.environ['DATABASE_URL'] = db_url.replace('postgres://', 'postgresql://')
    print('Fixed DATABASE_URL format')
"

# Run migrations with error handling
if poetry run flask db upgrade; then
    echo "Database migrations completed successfully"
else
    echo "Error: Database migrations failed"
    exit 1
fi

echo "Build completed successfully!" 