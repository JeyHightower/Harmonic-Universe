#!/bin/bash
# start.sh - Application startup script for Render deployment

set -e # Exit on error

echo "Starting Harmonic Universe application..."
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Set environment variables
export RENDER=true
export FLASK_APP=backend.app:create_app
export FLASK_ENV=production
export FLASK_DEBUG=0
export PYTHONPATH=$(pwd):$PYTHONPATH

# Fix PostgreSQL URL format if needed
if [[ $DATABASE_URL == postgres://* ]]; then
  export DATABASE_URL=${DATABASE_URL/postgres:\/\//postgresql:\/\/}
  echo "Fixed DATABASE_URL format from postgres:// to postgresql://"
fi

# Determine the port to use (Render sets PORT automatically)
PORT="${PORT:-10000}"
echo "Application will listen on port $PORT"

# Create static directory if it doesn't exist
mkdir -p static

# Create logs directory for application logs
mkdir -p logs

# Check if static files exist
echo "Checking static files..."
if [ -d "static" ]; then
  file_count=$(ls -la static | wc -l)
  echo "Found $(($file_count - 3)) files in static directory"
  
  if [ -f "static/index.html" ]; then
    echo "index.html exists"
  else
    echo "WARNING: index.html not found in static directory"
  fi
else
  echo "WARNING: static directory not found"
fi

# Start the application with gunicorn
echo "Starting application with gunicorn..."
exec gunicorn backend.wsgi:app \
  --bind 0.0.0.0:$PORT \
  --workers 2 \
  --threads 2 \
  --timeout 60 \
  --access-logfile logs/access.log \
  --error-logfile logs/error.log \
  --log-level info 