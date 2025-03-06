#!/bin/bash
set -e  # Exit on error

echo "Starting build process..."

# Run the reset script to forcibly handle SQLAlchemy
echo "Running dependency reset script..."
python reset.py

# Install other dependencies
echo "Installing remaining dependencies..."
pip install --no-cache-dir -r requirements.txt

# Setup python environment
echo "Setting up Python environment..."
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Ensure the app directory structure exists
echo "Checking app directory structure..."
mkdir -p app/core

# Try to set up the database (continue on error)
echo "Attempting to set up database..."
python -c "try:
    from app.core.database import Base, engine
    Base.metadata.create_all(bind=engine)
    print('Database tables created successfully')
except Exception as e:
    print(f'Warning: Could not create database tables: {e}')
    # Don't fail the build
" || echo "Database setup warning - continuing build"

# Run migrations if alembic directory exists
if [ -d "alembic" ]; then
  echo "Attempting to run database migrations..."
  alembic upgrade head || echo "Migration warning - continuing build"
fi

echo "Build completed successfully!"
