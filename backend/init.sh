#!/bin/sh

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL started"

# Initialize the database
flask db upgrade

# Start the Flask application
flask run --host=0.0.0.0
