#!/bin/bash
set -e

# Apply database migrations
echo "Applying database migrations..."
flask db upgrade

# Ensure proper permissions for the application
echo "Setting permissions..."
find /app -type d -exec chmod 755 {} \;
find /app -type f -exec chmod 644 {} \;

# Apply MIME type fixes
echo "Applying MIME type fixes..."
export DEPLOYMENT_PLATFORM="render"

# Start the application
echo "Starting application..."
exec "$@" 