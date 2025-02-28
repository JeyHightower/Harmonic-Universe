#!/bin/bash

# setup_database.sh
# Script to set up the database tables for Harmonic Universe

# Run the latest database setup script
python3 backend/scripts/setup_all_tables_v5.py

# Initialize the database
python3 backend/scripts/init_database.py

# Verify the database setup
python3 backend/scripts/verify_db.py

# Output success message
echo "Database setup complete!"
