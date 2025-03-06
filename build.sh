#!/bin/bash
set -e  # Exit on error

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Setup python environment
echo "Setting up Python environment..."
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Create initial database tables if they don't exist
echo "Setting up database..."
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"

# Run migrations if needed
if [ -d "alembic" ]; then
  echo "Running database migrations..."
  alembic upgrade head
fi

echo "Build completed successfully!"
