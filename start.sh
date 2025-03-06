#!/bin/bash
set -e

echo "Starting Harmonic Universe application..."

# Make sure PORT is set
if [ -z "$PORT" ]; then
    export PORT=10000
    echo "Using default port: $PORT"
else
    echo "Using configured port: $PORT"
fi

# Check if we're on Render
if [ -n "$RENDER" ]; then
    echo "Running on Render.com"
    # Start with gunicorn (more suitable for production)
    exec gunicorn --bind "0.0.0.0:$PORT" --workers 1 --threads 4 wsgi:app
else
    echo "Running locally"
    # Start with Flask development server (better for local development)
    python app.py
fi
