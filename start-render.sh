#!/usr/bin/env bash
set -o errexit

echo "=== Starting Harmonic Universe Application ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Node version: $(node --version)"
echo "Directory contents:"
ls -la

# Try different WSGI configurations
if [ -f wsgi.py ]; then
  echo "Found wsgi.py in root directory"
  WSGI_MODULE="wsgi:application"
elif [ -f app/wsgi.py ]; then
  echo "Found app/wsgi.py"
  WSGI_MODULE="app.wsgi:application"
else
  echo "ERROR: No wsgi.py found in expected locations!"
  echo "Searching for any wsgi files:"
  find . -name "wsgi*.py" -type f
  exit 1
fi

# Print the selected WSGI module
echo "Using WSGI module: $WSGI_MODULE"

# Start the application
echo "Starting application with Gunicorn on port $PORT..."
exec gunicorn $WSGI_MODULE --bind 0.0.0.0:$PORT --log-level info
