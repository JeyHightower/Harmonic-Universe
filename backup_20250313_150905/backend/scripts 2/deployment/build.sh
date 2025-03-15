#!/bin/bash

# Exit on error
set -e

echo "Starting Harmonic Universe build process..."

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build

# Build backend
echo "Building backend..."
cd ../backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Run tests
echo "Running tests..."
cd ../
./scripts/setup/run_tests.sh

echo "Build completed successfully!"
