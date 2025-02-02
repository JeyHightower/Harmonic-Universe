#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
YELLOW='\033[1;33m'

# Error handling
set -e

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to print error messages
print_error() {
    echo -e "\n${RED}ERROR: $1${NC}\n"
}

# Function to print success messages
print_success() {
    echo -e "\n${GREEN}SUCCESS: $1${NC}\n"
}

# Function to check if a Python package is installed
check_package() {
    python3 -c "import $1" 2>/dev/null || return 1
    return 0
}

# Navigate to the backend directory
cd "$(dirname "$0")"

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    print_error "requirements.txt not found!"
    exit 1
fi

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_header "Creating virtual environment"
    python3 -m venv venv || {
        print_error "Failed to create virtual environment"
        exit 1
    }
    print_success "Virtual environment created"
fi

# Activate virtual environment
print_header "Activating virtual environment"
source venv/bin/activate || {
    print_error "Failed to activate virtual environment"
    exit 1
}

# Upgrade pip
print_header "Upgrading pip"
python -m pip install --upgrade pip || {
    print_error "Failed to upgrade pip"
    exit 1
}

# Install dependencies
print_header "Installing dependencies"
pip install -r requirements.txt || {
    print_error "Failed to install dependencies"
    exit 1
}

# Verify key dependencies
print_header "Verifying dependencies"
REQUIRED_PACKAGES=("flask" "pytest" "sqlalchemy" "alembic")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
    if ! check_package "$package"; then
        MISSING_PACKAGES+=("$package")
    fi
done

if [ ${#MISSING_PACKAGES[@]} -ne 0 ]; then
    print_error "Missing required packages: ${MISSING_PACKAGES[*]}"
    print_header "Attempting to reinstall missing packages"
    for package in "${MISSING_PACKAGES[@]}"; do
        pip install "$package" --no-cache-dir || {
            print_error "Failed to install $package"
            exit 1
        }
    done
fi

# Set up test environment variables
print_header "Setting up test environment"
export TESTING=1
export FLASK_ENV=testing
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Run the test runner
print_header "Running tests"
python run_tests.py || {
    print_error "Tests failed"
    deactivate
    exit 1
}

# Deactivate virtual environment
deactivate

print_success "Test run complete"
