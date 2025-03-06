#!/bin/bash
set -e

echo "Starting Harmonic Universe application..."

# Make sure PORT is set
if [ -z "$PORT" ]; then
    export PORT=10000
    echo "PORT not set, using default: $PORT"
else
    echo "Using PORT: $PORT"
fi

# Check if we're on Render.com
if [ -n "$RENDER" ]; then
    echo "Running on Render.com"
    # Use gunicorn for production
    exec gunicorn --bind "0.0.0.0:$PORT" wsgi:app
else
    echo "Running locally"
    # For local development, we have two options:

    # Option 1: Use Flask's development server (better for debugging)
    python app.py

    # Option 2: Use gunicorn locally (uncomment to use)
    # exec gunicorn --bind "0.0.0.0:$PORT" wsgi:app --reload
fi
