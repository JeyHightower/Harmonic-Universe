#!/bin/bash

# Exit on error
set -e

# Check for frontend directory
if [ ! -d "frontend" ]; then
    echo "Frontend directory does not exist."
    exit 1
fi

# Install frontend dependencies and build
cd frontend
if [ -d "node_modules" ]; then
    rm -rf node_modules
fi
npm install
npm run build 

# Check for backend directory
if [ ! -d "../backend" ]; then
    echo "Backend directory does not exist."
    exit 1
fi

# Move to backend
cd ../backend

# Install backend dependencies
pip install -r requirements.txt
pip install psycopg2 

# Run database migrations and seed data
flask db upgrade
flask seed all 