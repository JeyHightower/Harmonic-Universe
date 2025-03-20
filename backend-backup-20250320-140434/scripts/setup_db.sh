#!/bin/bash

# PostgreSQL connection details
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="harmonic_universe_dev"

# Create database
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h localhost -p 5432 postgres << EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;
EOF

echo "Database $DB_NAME created successfully"

# Set up environment variables
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
export PYTHONPATH="/Users/jameshightower/Desktop/AppAcademy/capstone/projects/Harmonic-Universe/backend:$PYTHONPATH"

# Initialize database schema
cd /Users/jameshightower/Desktop/AppAcademy/capstone/projects/Harmonic-Universe/backend
python -c "
import os
os.environ['DATABASE_URL'] = '$DATABASE_URL'
from app.db.session import get_db
from app.db.init_db import init_db
with get_db() as db:
    init_db(db)
"

echo "Database initialization completed"
