#!/usr/bin/env bash
set -o errexit

echo "=== Starting Harmonic Universe Application ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Activate virtual environment
source .venv/bin/activate

# Verify gunicorn is installed
which gunicorn || echo "ERROR: gunicorn not found in PATH"
pip list | grep gunicorn

# Start with gunicorn
echo "Starting application with Gunicorn on port $PORT..."
if [ -f app/wsgi.py ]; then
  gunicorn app.wsgi:application --bind 0.0.0.0:$PORT --log-level info
elif [ -f wsgi.py ]; then
  gunicorn wsgi:application --bind 0.0.0.0:$PORT --log-level info
else
  # Fallback to app.py directly
  gunicorn app:app --bind 0.0.0.0:$PORT --log-level info
fi
