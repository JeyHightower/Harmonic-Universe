#!/bin/bash
set -e

echo "=== Starting Gunicorn for Harmonic Universe ==="

# Ensure Gunicorn is installed
if ! command -v gunicorn &> /dev/null; then
    echo "Gunicorn not found in PATH. Installing..."
    python -m pip install gunicorn==20.1.0

    # Add local bin directory to PATH if it's not already there
    export PATH=$PATH:$HOME/.local/bin:/usr/local/bin

    # Check again
    if ! command -v gunicorn &> /dev/null; then
        echo "ERROR: Gunicorn still not found in PATH after installation"
        echo "Current PATH: $PATH"
        echo "Attempting to run with python -m gunicorn instead"
        exec python -m gunicorn wsgi:app --log-level debug --workers 1 --timeout 120
    fi
fi

echo "Using Gunicorn: $(which gunicorn) version $(gunicorn --version)"

# Set Python path to include current directory
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Print debug information
echo "Current directory: $(pwd)"
echo "Python path: $PYTHONPATH"
echo "Files in current directory:"
ls -la

# Ensure wsgi.py exists
if [ ! -f "wsgi.py" ]; then
    echo "ERROR: wsgi.py not found"
    exit 1
fi

# Start Gunicorn
echo "Starting Gunicorn with wsgi:app"
exec gunicorn wsgi:app --log-level debug --workers 1 --timeout 120
