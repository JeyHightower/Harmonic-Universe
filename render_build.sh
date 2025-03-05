#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

echo "==================================================="
echo "    HARMONIC UNIVERSE - RENDER BUILD PROCESS       "
echo "==================================================="

# Build frontend
if [ -d "frontend" ]; then
  echo "Building frontend..."
  cd frontend
  npm install
  npm run build
  cd ..
  echo "Frontend build complete!"
else
  echo "Frontend directory not found, skipping frontend build"
fi

# Build backend
echo "Setting up backend..."
python -m pip install --upgrade pip

# Check if requirements.txt exists and install dependencies
if [ -f "backend/requirements.txt" ]; then
  echo "Installing backend dependencies from backend/requirements.txt"
  python -m pip install -r backend/requirements.txt
elif [ -f "requirements.txt" ]; then
  echo "Installing dependencies from requirements.txt"
  python -m pip install -r requirements.txt
else
  echo "WARNING: No requirements.txt found!"
fi

# Install core dependencies explicitly to ensure they're available
echo "Installing core dependencies..."
python -m pip install flask flask_sqlalchemy flask_migrate gunicorn==21.2.0 psycopg2

# Show installed packages for debugging
echo "Installed packages:"
python -m pip list

# Handle database operations with better Flask app configuration
echo "Setting up database..."

# First determine where our Flask app is located
FLASK_APP=""
FLASK_APP_DIR=""

if [ -d "backend" ] && [ -f "backend/app/__init__.py" ]; then
  echo "Found Flask app in backend/app"
  FLASK_APP="app.main:app"
  FLASK_APP_DIR="backend"
elif [ -d "backend" ] && [ -f "backend/main.py" ]; then
  echo "Found Flask app in backend/main.py"
  FLASK_APP="main:app"
  FLASK_APP_DIR="backend"
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then
  echo "Found Flask app in app"
  FLASK_APP="app.main:app"
  FLASK_APP_DIR="."
elif [ -f "app.py" ]; then
  echo "Found Flask app in app.py"
  FLASK_APP="app:app"
  FLASK_APP_DIR="."
else
  echo "WARNING: Could not locate Flask app - skipping database operations"
  echo "Tried looking in: backend/app, backend/main.py, app/, and app.py"
  exit 0
fi

echo "Using Flask app: $FLASK_APP in directory: $FLASK_APP_DIR"

# Navigate to the Flask app directory
cd $FLASK_APP_DIR
echo "Working directory: $(pwd)"

# Set environment variables for Flask
export FLASK_APP=$FLASK_APP
export PYTHONPATH=$PYTHONPATH:$(pwd)

echo "PYTHONPATH: $PYTHONPATH"
echo "FLASK_APP: $FLASK_APP"

# List files to diagnose issues
echo "Files in current directory:"
ls -la

# Check for migrations directory
if [ ! -d "migrations" ]; then
  echo "Migrations directory not found. Initializing migrations..."
  # Create an explicit migrations directory
  mkdir -p migrations
  echo "Created migrations directory: $(pwd)/migrations"

  # Initialize migrations
  echo "Running: flask db init"
  flask db init

  echo "Migrations directory after init:"
  ls -la migrations/
fi

# Run database migrations
echo "Running database migrations..."
flask db upgrade

# Run database seed if the command exists
if flask seed --help > /dev/null 2>&1; then
  echo "Running database seed..."
  flask seed all
else
  echo "Seed command not available - skipping"
fi

# Return to root directory
if [ "$FLASK_APP_DIR" != "." ]; then
  cd ..
fi

echo "==================================================="
echo "       BUILD PROCESS COMPLETED SUCCESSFULLY        "
echo "==================================================="
