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

# Create tables directly with models
echo "Creating database tables..."
python -c "
from app import create_app
from app.extensions import db
from app.api.models import *

app = create_app()
with app.app_context():
    db.create_all()
    print('All database tables created successfully')
"

# Create demo data
echo "Creating demo data..."
python scripts/create_demo_data.py

# Start the application
echo "Starting application..."
exec flask run --host=0.0.0.0 --port=5001
