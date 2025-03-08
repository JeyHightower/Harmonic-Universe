#!/bin/bash
set -e  # Exit immediately if a command fails
set -x  # Print each command before execution

echo "Starting application..."

# Install dependencies
pip install -r requirements.txt

# Run setup script for static directories
python setup_static.py

# Start the application
exec gunicorn --bind=0.0.0.0:10000 --workers=2 --log-level=info app:app
