#!/bin/bash
set -e

# Function to wait for database
wait_for_db() {
    echo "Waiting for database..."
    while ! pg_isready -h db -U harmonic_user -d harmonic_universe; do
        echo "Database is unavailable - sleeping"
        sleep 1
    done
    echo "Database is up!"
}

# Wait for database to be ready
wait_for_db

# Apply database migrations
echo "Applying database migrations..."
flask db upgrade

# Create demo data
echo "Creating demo data..."
python scripts/create_demo_data.py

# Start the application
echo "Starting application..."
exec flask run --host=0.0.0.0 --port=5001
