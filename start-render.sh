#!/usr/bin/env bash
set -o errexit

echo "=== Starting Harmonic Universe Application ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Node version: $(node --version)"

# Verify that wsgi.py exists
if [ ! -f wsgi.py ]; then
  echo "ERROR: wsgi.py not found in current directory!"
  echo "Current directory contents:"
  ls -la
  exit 1
fi

# Start the application with wsgi:application
echo "Starting application with Gunicorn on port $PORT..."
echo "Using wsgi.py in root directory"
exec gunicorn wsgi:application --bind 0.0.0.0:$PORT --log-level info
