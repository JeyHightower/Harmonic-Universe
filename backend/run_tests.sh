#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run tests with proper formatting
run_test_suite() {
    echo -e "\n${GREEN}Running $1...${NC}"
    $2
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 passed${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Ensure we're in the backend directory
cd "$(dirname "$0")"

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run linting
run_test_suite "Linting" "flake8 app tests"

# Run type checking
run_test_suite "Type checking" "mypy app tests"

# Run security checks
run_test_suite "Security checks" "bandit -r app"

# Run unit tests with coverage
echo -e "\n${GREEN}Running unit tests with coverage...${NC}"
coverage run -m pytest tests/unit -v
coverage report
coverage html

# Run API tests
run_test_suite "API tests" "pytest tests/api -v"

# Test Categories:

# 1. Model Tests
#    - User model
#    - Universe model
#    - Storyboard model
#    - Scene model
#    - PhysicsObject model
#    - PhysicsConstraint model

# 2. Route Tests
#    - Auth routes
#    - User routes
#    - Universe routes
#    - Storyboard routes
#    - Scene routes
#    - Physics routes

# 3. Integration Tests
#    - User workflow
#    - Universe creation and management
#    - Storyboard operations
#    - Scene editing
#    - Physics simulation
#    - Collaboration features

# 4. Validation Tests
#    - Input validation
#    - Authorization checks
#    - Data integrity
#    - Error handling

# 5. Performance Tests
#    - Database query optimization
#    - Physics simulation performance
#    - API response times
#    - Memory usage

# Clean up
deactivate

echo -e "\n${GREEN}All tests completed successfully!${NC}"

