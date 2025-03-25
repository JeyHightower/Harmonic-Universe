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
poetry install --only main

# Run database migrations
echo "Running database migrations..."
poetry run flask db upgrade

echo "Build completed successfully!" 