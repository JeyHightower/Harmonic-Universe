#!/bin/bash

# Exit on error
set -e

# Print start message with date
echo "===== STARTING DEPLOYMENT PROCESS ====="
date

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Homebrew is not installed. Please install it first:"
    echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    exit 1
fi

# Update system
echo "===== UPDATING SYSTEM ====="
brew update
brew install python@3.11
brew install node@20

# Configure Python
echo "===== CONFIGURING PYTHON ====="
python3 -m pip install --upgrade pip setuptools wheel

# Clean up old environment
echo "===== CLEANING UP OLD ENVIRONMENT ====="
rm -rf venv
rm -rf frontend/node_modules
rm -f frontend/package-lock.json

# Set up Python environment
echo "===== SETTING UP PYTHON ENVIRONMENT ====="
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "===== INSTALLING PYTHON DEPENDENCIES ====="
pip install --upgrade pip setuptools wheel
pip install -r backend/requirements.txt

# Set up Node environment
echo "===== SETTING UP NODE ENVIRONMENT ====="
cd frontend
echo "Setting up Node.js environment..."
echo "Cleaning up previous installations..."
rm -rf node_modules package-lock.json
echo "Installing Node dependencies..."
npm install
npm install vite@latest @vitejs/plugin-react@latest --save-dev
echo "Building frontend..."
npm run build
cd ..

# Collect static files
echo "===== COLLECTING STATIC FILES ====="
python manage.py collectstatic --noinput

# Run database migrations
echo "===== RUNNING MIGRATIONS ====="
python manage.py migrate

echo "===== DEPLOYMENT COMPLETE ====="
echo "Next steps:"
echo "1. Update your .env file with the necessary environment variables"
echo "2. Start your application with: 'gunicorn backend.wsgi:application'"
echo "3. Access your application at http://localhost:8000"
