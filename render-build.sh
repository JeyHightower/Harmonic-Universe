#!/usr/bin/env bash
set -o errexit

echo "=== Starting Harmonic Universe Build Process ==="
echo "Python version: $(python --version)"

# Install Python dependencies with Poetry
echo "Installing Python dependencies..."
poetry install

# If you have a Django application
if [ -f manage.py ]; then
  echo "Running database migrations..."
  python manage.py migrate

  echo "Collecting static files..."
  python manage.py collectstatic --noinput
fi

# If you have frontend build steps
if [ -f package.json ]; then
  echo "Installing frontend dependencies..."
  npm install

  echo "Building frontend assets..."
  npm run build
fi

echo "Build process completed successfully!"
