#!/bin/bash
# Post-start script for Render.com
# This runs just before the application starts

set -e  # Exit on error

echo "=============== RENDER START SCRIPT ==============="
echo "Current directory: $(pwd)"
echo "Environment: RENDER=${RENDER}"

# Ensure static directory exists with correct permissions
echo "Ensuring static directory exists..."
mkdir -p /opt/render/project/src/static
chmod 755 /opt/render/project/src/static

# List static directory contents for verification
echo "Render-specific static directory contents:"
ls -la /opt/render/project/src/static/

echo "Start script completed successfully"
echo "Starting application with Gunicorn..."

# Start Gunicorn with our configuration
exec gunicorn -c gunicorn.conf.py wsgi:app
