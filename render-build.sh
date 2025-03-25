#!/bin/bash

# Exit on error
set -e

# Add Poetry binary to PATH
export PATH="/opt/render/project/poetry/bin:$PATH"

# Navigate to backend directory
cd backend

# Install production dependencies only
echo "Installing dependencies with Poetry..."
poetry install --no-dev

# Run database migrations
echo "Running database migrations..."
poetry run flask db upgrade

echo "Build completed successfully!" 