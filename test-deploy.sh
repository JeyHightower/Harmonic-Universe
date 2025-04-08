#!/bin/bash
set -e

echo "======== TESTING FULL DEPLOYMENT LOCALLY ========"
echo "This script simulates the Render deployment process locally"
echo "It will build the frontend and then start the backend"

# Clean build directories
echo "Cleaning build directories..."
rm -rf frontend/dist
rm -rf backend/static
mkdir -p backend/static

# Run the build script
echo "Running build script..."
bash render-build.sh || {
    echo "Build failed, but continuing to test what we have..."
}

# Copy frontend build to backend static directory
if [ -d "frontend/dist" ]; then
    echo "Copying frontend build to backend/static..."
    cp -r frontend/dist/* backend/static/
else
    echo "WARNING: No frontend build found. Backend will serve fallback UI."
fi

# Run the start script
echo "Starting the application in test mode..."
export PORT=5000
export FLASK_ENV=development
export PYTHONPATH="$PYTHONPATH:$(pwd):$(pwd)/backend"

# Start the backend
cd backend
python -m flask run --host=0.0.0.0 --port=$PORT

echo "Test deployment complete!" 