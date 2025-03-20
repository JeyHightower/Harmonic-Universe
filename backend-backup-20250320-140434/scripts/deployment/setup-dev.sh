#!/bin/bash

# Install dependencies
yarn install

# Set up frontend
cd frontend
yarn install
cd ..

# Set up backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Set up git hooks
yarn husky install

# Create necessary directories
mkdir -p logs
mkdir -p data

echo "Development environment setup complete!"
