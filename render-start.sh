#!/usr/bin/env bash
set -o errexit

echo "=== Starting Harmonic Universe Application ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Source the gunicorn path if available
if [ -f gunicorn_path.sh ]; then
  source gunicorn_path.sh
  echo "Loaded gunicorn path: $GUNICORN_PATH"
else
  echo "WARNING: gunicorn_path.sh not found"
fi

# Try to find gunicorn through various methods
if [ -z "$GUNICORN_PATH" ]; then
  GUNICORN_PATH=$(which gunicorn 2>/dev/null || echo "")
  if [ -z "$GUNICORN_PATH" ]; then
    GUNICORN_PATH="/home/render/.local/bin/gunicorn"  # Common Render.com path
  fi
fi

echo "Using gunicorn at: $GUNICORN_PATH"

# Check if we found gunicorn
if [ ! -x "$GUNICORN_PATH" ]; then
  echo "ERROR: Could not find executable gunicorn"
  # Emergency install
  pip install gunicorn
  GUNICORN_PATH=$(which gunicorn)
  echo "Emergency install - Gunicorn found at: $GUNICORN_PATH"
fi

# Start the application
echo "Starting application with Gunicorn on port $PORT..."
if [ -f wsgi.py ]; then
  echo "Using wsgi.py in root directory"
  $GUNICORN_PATH wsgi:application --bind 0.0.0.0:$PORT --log-level info
elif [ -f app/wsgi.py ]; then
  echo "Using app/wsgi.py"
  $GUNICORN_PATH app.wsgi:application --bind 0.0.0.0:$PORT --log-level info
else
  echo "Using app.py directly"
  $GUNICORN_PATH app:app --bind 0.0.0.0:$PORT --log-level info
fi
