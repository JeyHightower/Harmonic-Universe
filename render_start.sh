#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

echo "==================================================="
echo "    HARMONIC UNIVERSE - RENDER START PROCESS       "
echo "==================================================="

# Set up environment variables
export PYTHONUNBUFFERED=true  # Prevent Python from buffering stdout and stderr
export PYTHONPATH=$PYTHONPATH:$(pwd)  # Add current directory to Python path

echo "Setting up environment..."
echo "PYTHONPATH: $PYTHONPATH"

# Check if gunicorn is installed and available
if ! python -m pip show gunicorn > /dev/null 2>&1; then
  echo "ERROR: Gunicorn not found, installing..."
  python -m pip install gunicorn==21.2.0
fi

echo "Python path:"
python -c "import sys; print(sys.path)"

echo "Checking gunicorn location:"
which gunicorn || echo "gunicorn not found in PATH"

echo "Gunicorn package info:"
python -m pip show gunicorn

echo "Starting application server..."

# Determine the correct path to the app depending on directory structure
if [ -d "backend" ]; then
  echo "Backend directory found, using backend.app.main:app"
  cd backend
  exec gunicorn app.main:app --log-level debug
else
  echo "Using root directory, assuming app.main:app"
  exec gunicorn app.main:app --log-level debug
fi
