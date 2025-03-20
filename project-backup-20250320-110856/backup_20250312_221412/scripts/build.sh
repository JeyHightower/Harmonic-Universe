#!/bin/bash
# build.sh - Comprehensive build process for Harmonic Universe
set -e  # Exit on error

echo "🚀 Starting build process..."

# Install system dependencies
echo "📦 Installing system dependencies..."
apt-get update && apt-get install -y \
    nginx \
    curl \
    build-essential \
    python3-dev

# Setup Python environment
echo "🐍 Setting up Python environment..."
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

# Setup Node environment
echo "📦 Setting up Node environment..."
cd frontend
npm install
echo "🏗️ Building frontend..."
npm run build
cd ..

# Setup Nginx
echo "🔧 Configuring Nginx..."
cp nginx/nginx.conf /etc/nginx/sites-available/default
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Collect static files
echo "📚 Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations
echo "🔄 Running database migrations..."
python manage.py migrate --noinput

echo "✅ Build process completed!"
