#!/bin/bash
set -e

echo "Setting up database..."

# Create migrations
echo "Running migrations..."
python migrations.py

# Seed database with initial data
echo "Seeding database with sample data..."
python seed.py

echo "Database setup completed successfully!"
