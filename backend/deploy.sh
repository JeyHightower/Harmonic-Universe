#!/bin/bash
set -e

# Deploy script for Render.com

echo "Starting deployment process..."

# Set PYTHONPATH to include the project root
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
echo "PYTHONPATH: $PYTHONPATH"

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Start Gunicorn with proper configuration
echo "Starting Gunicorn..."
gunicorn app.main:app --log-level info --workers 2 --timeout 120 --access-logfile - --error-logfile -
