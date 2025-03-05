#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

echo "==================================================="
echo "    HARMONIC UNIVERSE - RENDER START PROCESS       "
echo "==================================================="

# Set up environment variables
export PYTHONUNBUFFERED=true  # Prevent Python from buffering stdout and stderr

echo "Setting up environment..."

# Check if gunicorn is installed and available
if ! python -m pip show gunicorn > /dev/null 2>&1; then
  echo "ERROR: Gunicorn not found, installing..."
  python -m pip install gunicorn==21.2.0
fi

echo "Python path before modifications:"
python -c "import sys; print(sys.path)"

echo "Checking gunicorn location:"
which gunicorn || echo "gunicorn not found in PATH"

echo "Gunicorn package info:"
python -m pip show gunicorn

echo "Starting application server..."

# List files in key directories to help debugging
echo "Files in current directory:"
ls -la

# First determine where our Flask app is located
FLASK_APP=""
FLASK_APP_DIR=""
GUNICORN_APP=""

if [ -d "backend" ] && [ -f "backend/app/__init__.py" ]; then
  echo "Found Flask app in backend/app"
  FLASK_APP="app.main:app"
  FLASK_APP_DIR="backend"
  GUNICORN_APP="app.main:app"
elif [ -d "backend" ] && [ -f "backend/main.py" ]; then
  echo "Found Flask app in backend/main.py"
  FLASK_APP="main:app"
  FLASK_APP_DIR="backend"
  GUNICORN_APP="main:app"
elif [ -d "backend" ] && [ -f "backend/app.py" ]; then
  echo "Found Flask app in backend/app.py"
  FLASK_APP="app:app"
  FLASK_APP_DIR="backend"
  GUNICORN_APP="app:app"
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then
  echo "Found Flask app in app"
  FLASK_APP="app.main:app"
  FLASK_APP_DIR="."
  GUNICORN_APP="app.main:app"
elif [ -f "app.py" ]; then
  echo "Found Flask app in app.py"
  FLASK_APP="app:app"
  FLASK_APP_DIR="."
  GUNICORN_APP="app:app"
else
  echo "WARNING: Could not locate Flask app"
  echo "Tried looking in: backend/app, backend/main.py, backend/app.py, app/, and app.py"
  echo "Will use default: app.main:app in backend/"
  FLASK_APP="app.main:app"
  FLASK_APP_DIR="backend"
  GUNICORN_APP="app.main:app"
fi

echo "Using Flask app: $FLASK_APP in directory: $FLASK_APP_DIR"

# Navigate to the Flask app directory
cd $FLASK_APP_DIR
echo "Working directory: $(pwd)"

# Set environment variables for Flask
export FLASK_APP=$FLASK_APP
export PYTHONPATH=$PYTHONPATH:$(pwd)

echo "Final environment:"
echo "PYTHONPATH: $PYTHONPATH"
echo "FLASK_APP: $FLASK_APP"
echo "Working directory: $(pwd)"

# List files again after changing directory
echo "Files in application directory:"
ls -la

# Check if our target app file exists
python -c "import importlib.util; print('App module can be imported:' if importlib.util.find_spec('$GUNICORN_APP'.split(':')[0].replace('.', '/')) else 'App module NOT FOUND')" || echo "Error checking module"

echo "Python path after modifications:"
python -c "import sys; print(sys.path)"

echo "Starting Gunicorn with app: $GUNICORN_APP"
exec gunicorn $GUNICORN_APP --log-level debug --preload
