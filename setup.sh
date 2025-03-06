#!/bin/bash

# Setup script for Harmonic Universe
# This script checks Python environment, dependencies, and initializes the database

# Exit on error
set -e

echo "==== Harmonic Universe Setup ===="
echo "Running setup script..."

# Check Python version
echo "Checking Python version..."
python3 --version

# Check if virtual environment exists and activate it
if [ -d "venv" ]; then
    echo "Virtual environment found, activating..."
    source venv/bin/activate
else
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
fi

# Verify pip is installed
echo "Checking pip installation..."
pip --version

# Install dependencies from requirements.txt
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

# Check flask_migrate installation
echo "Checking flask_migrate installation..."
pip list | grep Flask-Migrate

# Create test script to check imports
echo "Creating test script to check imports..."
cat > test_imports.py << EOF
try:
    import flask
    print(f"✅ Flask {flask.__version__} imported successfully")

    import sqlalchemy
    print(f"✅ SQLAlchemy {sqlalchemy.__version__} imported successfully")

    from flask_migrate import Migrate
    print("✅ Flask-Migrate imported successfully")

    import jwt
    print(f"✅ PyJWT {jwt.__version__} imported successfully")

    import flask_cors
    print(f"✅ Flask-CORS {flask_cors.__version__} imported successfully")

    exit(0)
except ImportError as e:
    print(f"❌ Import error: {e}")
    exit(1)
EOF

# Run the test script
echo "Testing imports..."
python test_imports.py

# Initialize the database
echo "Initializing database..."
python init_db.py

# Check the port configuration
echo "Creating port configuration file if it doesn't exist..."
if [ ! -f "port.py" ]; then
    cat > port.py << EOF
import os

def get_port():
    """Get the port to use for the application.
    Will try PORT environment variable first, then fallback to 5000.
    """
    try:
        port = int(os.environ.get("PORT", 5000))
        # Try alternate port if default is in use
        if port == 5000:
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            try:
                s.bind(("0.0.0.0", port))
                s.close()
            except OSError:
                # Port 5000 is in use, try 5001
                port = 5001
        return port
    except ValueError:
        return 5000
EOF
    echo "Created port.py"
fi

echo "Setup completed successfully!"
