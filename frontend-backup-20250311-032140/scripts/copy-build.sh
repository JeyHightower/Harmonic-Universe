#!/bin/bash
set -e

# Print current directory for debugging
echo "Current directory: $(pwd)"

# Ensure the frontend/dist directory exists
if [ ! -d "frontend/dist" ]; then
  echo "Creating frontend/dist directory"
  mkdir -p frontend/dist
fi

# List contents for debugging
echo "Contents of frontend/dist:"
ls -la frontend/dist/

# Ensure the static directory exists
if [ ! -d "static" ]; then
  echo "Creating static directory"
  mkdir -p static
fi

# Copy files using a more robust approach
echo "Copying files from frontend/dist to static"
if [ -d "frontend/dist" ] && [ "$(ls -A frontend/dist 2>/dev/null)" ]; then
  # Directory exists and is not empty
  cp -rv frontend/dist/* static/
else
  # Directory is empty or doesn't exist
  echo "WARNING: frontend/dist is empty or doesn't exist, creating placeholder"
  echo "Build output would normally be here" > static/placeholder.txt
fi

echo "Copy operation completed"
