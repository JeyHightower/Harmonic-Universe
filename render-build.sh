#!/bin/bash

# Exit on error
set -e

# Install frontend dependencies and build
npm install --prefix frontend &&
npm run build --prefix frontend &&

# Install backend dependencies
pip install -r backend/requirements.txt &&
pip install psycopg2 &&

# Run database migrations and seed data
cd backend &&
flask db upgrade &&
flask seed all 