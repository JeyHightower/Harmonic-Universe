#!/bin/bash
set -e

echo "Starting Harmonic Universe application..."

# Make sure PORT is set
if [ -z "$PORT" ]; then
    export PORT=10000
    echo "WARNING: PORT not set, using default value of $PORT"
else
    echo "Using PORT: $PORT"
fi

# Export PYTHONPATH to ensure modules can be found
export PYTHONPATH="$PWD:$PYTHONPATH"

# Start with gunicorn
exec gunicorn --bind "0.0.0.0:$PORT" --workers 1 --threads 2 --log-level info wsgi:app
