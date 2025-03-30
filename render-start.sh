#!/bin/bash

# Exit on error
set -e

echo "Starting application..."

# Set Python version explicitly
export PYTHON_VERSION=3.11.0

# Navigate to backend directory
cd backend

# Activate virtual environment
source .venv/bin/activate

# Set up environment variables
export FLASK_APP=app.py
export FLASK_ENV=production
export FLASK_DEBUG=0
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Start the application with gunicorn
echo "Starting Gunicorn server..."
poetry run gunicorn \
    --bind 0.0.0.0:$PORT \
    'app:create_app()' \
    --worker-class eventlet \
    --workers 4 \
    --threads 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info 