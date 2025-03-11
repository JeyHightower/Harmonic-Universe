#!/bin/bash

# Exit on error
set -e

echo "Setting up Harmonic Universe development environment..."

# Create necessary directories
echo "Creating directory structure..."
mkdir -p {config,docs,scripts,tests}/{frontend,backend,shared} 2>/dev/null || true

# Set up frontend environment
echo "Setting up frontend environment..."
cd frontend
cp ../config/frontend/.env.example .env
npm install

# Set up backend environment
echo "Setting up backend environment..."
cd ../backend
cp ../config/backend/.env.example .env
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Initialize database
echo "Initializing database..."
flask db upgrade
flask seed run

# Set up git hooks
echo "Setting up git hooks..."
cp scripts/setup/pre-commit .git/hooks/
chmod +x .git/hooks/pre-commit

# Run initial tests
echo "Running initial tests..."
cd ../
./scripts/setup/run_tests.sh

echo "Development environment setup completed successfully!"
echo "You can now start the development servers:"
echo "1. Frontend: cd frontend && npm start"
echo "2. Backend: cd backend && flask run"
