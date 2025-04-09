#!/bin/bash

# Exit on error
set -e

echo "Starting Render build process..."

# Install dependencies
echo "Installing dependencies..."
pip install -r backend/requirements.txt

# Apply database migrations
echo "Applying database migrations..."
cd backend
python setup_db.py

# Return to the root directory
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build

echo "Build completed successfully! Both frontend and backend are ready to serve." 