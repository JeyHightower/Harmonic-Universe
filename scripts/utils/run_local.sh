#!/bin/bash
# Simple script to run the application locally

# Set variables
export FLASK_ENV=development
export FLASK_DEBUG=1
export PORT=8000

echo "===== Starting Harmonic Universe locally ====="
echo "Using port: $PORT"
echo "Environment: $FLASK_ENV"
echo ""
echo "You can access the application at: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop the server"
echo "====="

# Run the application
python app.py

# This script can be run with: ./run_local.sh
