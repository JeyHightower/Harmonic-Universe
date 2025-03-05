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

# Set PYTHONPATH and run Flask commands
export PYTHONPATH=$PYTHONPATH:$(pwd)
echo "PYTHONPATH set to: $PYTHONPATH"

# Run Flask commands if the Flask application is found
if python -c "import flask" 2>/dev/null; then
  # Check if we need to initialize migrations
  if [ ! -d "migrations" ] && [ ! -d "backend/migrations" ]; then
    echo "Migrations directory not found. Initializing migrations..."

    if [ -d "backend" ]; then
      echo "Initializing migrations in backend directory..."
      cd backend
      python -m flask db init
      cd ..
    else
      echo "Initializing migrations in root directory..."
      python -m flask db init
    fi
  fi

  echo "Running database migrations..."
  python -m flask db upgrade

  echo "Running database seed..."
  python -m flask seed all
else
  echo "WARNING: Flask not found, skipping database operations"
fi

echo "==================================================="
echo "       BUILD PROCESS COMPLETED SUCCESSFULLY        "
echo "==================================================="
