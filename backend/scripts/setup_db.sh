#!/bin/bash
set -e

# Default to development environment
ENV=${1:-development}

echo "Setting up database for $ENV environment..."

# Ensure we're in the backend directory
cd "$(dirname "$0")/.."

# Create necessary directories
mkdir -p uploads/{audio,exports,temp}
mkdir -p logs/{errors,metrics}

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Create database
echo "Creating database..."
python scripts/create_db.py --env $ENV

# Initialize database
echo "Initializing database..."
python scripts/db_ops.py init

# Verify database
echo "Verifying database..."
python scripts/db_ops.py verify

echo "Database setup completed successfully!"
