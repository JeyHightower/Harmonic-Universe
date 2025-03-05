#!/bin/bash
set -e

echo "Starting Harmonic Universe application..."

# Make sure PORT is set (Render sets this automatically)
if [ -z "$PORT" ]; then
    export PORT=10000
    echo "WARNING: PORT not set, using default value of $PORT"
else
    echo "Using PORT: $PORT"
fi

# Start with gunicorn using the PORT env variable
exec gunicorn --bind "0.0.0.0:$PORT" wsgi:app \
    --workers 1 \
    --threads 2 \
    --timeout 60 \
    --log-level info \
    --access-logfile '-' \
    --error-logfile '-'
