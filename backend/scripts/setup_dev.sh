#!/bin/bash

# Exit on error
set -e

echo "Setting up development environment..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
required_version="3.9.0"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "Error: Python version must be at least $required_version"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Install development dependencies
echo "Installing development dependencies..."
pip install -r requirements-dev.txt

# Check if Redis is installed
if ! command -v redis-cli &> /dev/null; then
    echo "Redis is not installed. Please install Redis:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  brew install redis"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  sudo apt-get install redis-server"
    else
        echo "  Please install Redis manually"
    fi
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env

    # Generate random secret keys
    SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
    JWT_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')

    # Update secret keys in .env
    sed -i.bak "s/your-secret-key-here/$SECRET_KEY/" .env
    sed -i.bak "s/your-jwt-secret-key/$JWT_SECRET_KEY/" .env
    rm -f .env.bak
fi

# Initialize database
echo "Initializing database..."
flask db upgrade

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    echo "Creating uploads directory..."
    mkdir uploads
fi

# Set up pre-commit hooks
if [ -f ".git/hooks/pre-commit" ]; then
    echo "Setting up pre-commit hooks..."
    cp scripts/pre-commit .git/hooks/
    chmod +x .git/hooks/pre-commit
fi

echo "Development environment setup complete!"
echo
echo "To start the development server:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Start Redis: redis-server"
echo "3. Start the development server: flask run"
echo
echo "For testing:"
echo "- Run tests: pytest"
echo "- Run tests with coverage: pytest --cov=app"
echo
echo "For database management:"
echo "- Create migration: flask db migrate -m 'description'"
echo "- Apply migrations: flask db upgrade"
echo "- Rollback migration: flask db downgrade"
echo
echo "API documentation will be available at: http://localhost:5000/api/docs"
