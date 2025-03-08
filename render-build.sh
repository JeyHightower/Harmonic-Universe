#!/usr/bin/env bash
set -o errexit

echo "=== Starting Harmonic Universe Build Process ==="
echo "Date: $(date)"
echo "Python version: $(python --version)"
echo "Node version: $(node --version)"
echo "Current directory: $(pwd)"
echo "Python executable: $(which python)"

# Install Python dependencies
echo "Installing Python dependencies..."
python -m pip install --upgrade pip

# Install main requirements
if [ -f requirements.txt ]; then
  echo "Installing main requirements..."
  python -m pip install -r requirements.txt
fi

# Install backend requirements if they exist
if [ -d "backend" ] && [ -f "backend/requirements.txt" ]; then
  echo "Installing backend requirements..."
  python -m pip install -r backend/requirements.txt
fi

# Run database migrations if available
if [ -f "backend/manage.py" ]; then
  echo "Running database migrations..."
  cd backend
  python manage.py migrate

  echo "Collecting static files..."
  python manage.py collectstatic --no-input
  cd ..
elif [ -f "manage.py" ]; then
  echo "Running database migrations..."
  python manage.py migrate

  echo "Collecting static files..."
  python manage.py collectstatic --no-input
fi

# If you have frontend build steps (Node.js/npm)
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  echo "Installing and building frontend..."
  cd frontend
  npm ci || npm install
  npm run build
  cd ..
elif [ -f "package.json" ]; then
  echo "Installing frontend dependencies..."
  npm ci || npm install

  echo "Building frontend assets..."
  npm run build
fi

# Handle static files
echo "Setting up static files..."
STATIC_DIR="static"

# Ensure static directory exists
if [ ! -d "$STATIC_DIR" ]; then
  echo "Creating static directory..."
  mkdir -p "$STATIC_DIR"
fi

# Copy frontend build to static directory if applicable
if [ -d "frontend/dist" ]; then
  echo "Copying frontend build to static directory..."
  cp -r frontend/dist/* $STATIC_DIR/
elif [ -d "frontend/build" ]; then
  echo "Copying frontend build to static directory..."
  cp -r frontend/build/* $STATIC_DIR/
fi

echo "Build process completed successfully."
