#!/bin/bash

# Exit on error
set -e

# Set Python version explicitly
export PYTHON_VERSION=3.11.0

# Navigate to backend directory
cd backend

# Start the application with gunicorn
echo "Starting application..."
poetry run gunicorn \
    --bind 0.0.0.0:$PORT \
    'app:create_app()' \
    --worker-class eventlet \
    --workers 4 \
    --threads 2 \
    --timeout 120 