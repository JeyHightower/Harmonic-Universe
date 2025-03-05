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

# List files in key directories to help debugging
echo "Files in current directory:"
ls -la

# First try to locate the Flask application to determine the right app path
APP_MODULE="app.main:app"

# Try to determine the correct app path
if [ -d "backend" ]; then
  echo "Backend directory found"
  if [ -f "backend/app/__init__.py" ]; then
    echo "App module found at backend/app/__init__.py"
    cd backend
    APP_MODULE="app.main:app"
  elif [ -f "backend/main.py" ]; then
    echo "Main module found at backend/main.py"
    cd backend
    APP_MODULE="main:app"
  else
    echo "Looking for app.py or similar in backend directory..."
    cd backend
    ls -la
    # Try to find any Python file that might be the main app file
    if [ -f "app.py" ]; then
      APP_MODULE="app:app"
    fi
  fi
elif [ -f "app/main.py" ]; then
  echo "App module found at app/main.py"
  APP_MODULE="app.main:app"
elif [ -f "main.py" ]; then
  echo "Main module found at main.py"
  APP_MODULE="main:app"
fi

echo "Using app module: $APP_MODULE"
echo "Starting from directory: $(pwd)"

# Start the application
exec gunicorn $APP_MODULE --log-level debug
