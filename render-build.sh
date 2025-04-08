#!/bin/bash

# Exit on error
set -e

# Install frontend dependencies and build
cd frontend && rm -rf node_modules && npm install && npm run build 

#move to backend
cd ../backend

# Install backend dependencies
pip install -r requirements.txt && pip install psycopg2 

# Run database migrations and seed data
flask db upgrade && flask seed all 