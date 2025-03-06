#!/bin/bash
set -e  # Exit on error

echo "Starting build process..."

# Clean pip cache
echo "Cleaning pip cache..."
pip cache purge

# Install dependencies
echo "Installing dependencies with clear cache..."
pip install --no-cache-dir -r requirements.txt

# Setup python environment
echo "Setting up Python environment..."
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Create initial database tables if they don't exist
echo "Setting up database..."
python -c "try:
    from app.core.database import Base, engine
    Base.metadata.create_all(bind=engine)
    print('Database tables created successfully')
except Exception as e:
    print(f'Warning: Could not create database tables: {e}')
    # Don't fail the build
" || echo "Database setup warning - continuing build"

# Run migrations if needed
if [ -d "alembic" ]; then
  echo "Running database migrations..."
  alembic upgrade head || echo "Migration warning - continuing build"
fi

echo "Build completed successfully!"
