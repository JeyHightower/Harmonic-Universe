#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Backend setup
cd backend
echo "📦 Installing backend dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "🔄 Running database migrations..."
flask db upgrade

echo "✨ Starting backend server..."
gunicorn app:app

# Frontend setup (if serving frontend from same server)
cd ../frontend
echo "📦 Installing frontend dependencies..."
npm install

echo "🏗️ Building frontend..."
npm run build

echo "🎉 Deployment complete!"
