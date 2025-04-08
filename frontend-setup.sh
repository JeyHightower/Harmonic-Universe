#!/bin/bash

# This script sets up the correct directory structure for Render
# It should be run before render-build.sh

# Exit on error
set -e

# Check current directory structure
echo "Current directory structure:"
ls -la

# Check if we're in the expected Render environment path
if [ -d "/opt/render/project/src" ]; then
  echo "Running in Render environment"
  
  # Create frontend directory if it doesn't exist
  if [ ! -d "/opt/render/project/src/frontend" ]; then
    echo "Creating frontend directory..."
    mkdir -p /opt/render/project/src/frontend
    
    # If package.json exists in the root and has React dependencies, copy it to frontend
    if [ -f "package.json" ] && grep -q "react" "package.json"; then
      echo "Found React package.json in root, copying to frontend..."
      cp -r ./* frontend/ 2>/dev/null || true
    fi
  fi
  
  # Ensure frontend/package.json exists
  if [ ! -f "/opt/render/project/src/frontend/package.json" ]; then
    echo "ERROR: Could not find or create frontend/package.json"
    echo "Current directory contains:"
    find . -type f -name "package.json" | sort
    exit 1
  fi
  
  echo "Frontend directory setup complete"
else
  echo "Not running in Render environment, skipping setup"
fi 