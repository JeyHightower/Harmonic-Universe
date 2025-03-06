#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting application..."

# Setup environment variables if not already set
export FLASK_DEBUG=1
export FLASK_ENV=development
export FLASK_APP=${FLASK_APP:-wsgi_app.py}
export PORT=${PORT:-5000}

# Run database migrations
echo "Running database migrations..."
flask db upgrade

# Start the application with gunicorn
echo "Starting web server on port $PORT..."
gunicorn --bind 0.0.0.0:$PORT wsgi:app
