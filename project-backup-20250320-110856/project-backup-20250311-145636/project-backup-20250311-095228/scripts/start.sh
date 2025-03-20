#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting application..."

# Start Nginx
echo "🌐 Starting Nginx..."
service nginx start

# Start Gunicorn
echo "🦄 Starting Gunicorn..."
gunicorn backend.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers $WEB_CONCURRENCY \
    --worker-class uvicorn.workers.UvicornWorker \
    --log-file - \
    --access-logfile - \
    --error-logfile - \
    --log-level info
