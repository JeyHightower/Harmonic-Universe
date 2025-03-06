#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Setup python environment
echo "Setting up Python environment..."
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Setup database
echo "Setting up database..."
python -c "from app import app; from migrations import run_migrations; run_migrations(app)"

echo "Build completed successfully!"
