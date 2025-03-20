#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Environment setup
setup_environment() {
    echo "Setting up test environment..."

    # Backend setup
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install -r requirements-test.txt
    cd ..

    # Frontend setup
    cd frontend
    npm install
    cd ..
}

# Function to run backend tests
run_backend_tests() {
    echo -e "${GREEN}Running backend tests...${NC}"
    cd backend
    source venv/bin/activate
    pytest tests/test_comprehensive.py --cov=app --cov-report=xml
    cd ..
}

# Function to run frontend tests
run_frontend_tests() {
    echo -e "${GREEN}Running frontend tests...${NC}"
    cd frontend
    npm run test
    cd ..
}

# Function to run integration tests
run_integration_tests() {
    echo -e "${GREEN}Running integration tests...${NC}"
    cd frontend
    npm run cypress:run
    cd ..
}

# Function to generate coverage report
generate_coverage() {
    echo -e "${GREEN}Generating coverage report...${NC}"
    cd backend
    coverage html
    cd ..
    cd frontend
    npm run coverage
    cd ..
}

# Main execution
case "$1" in
    "all")
        setup_environment
        run_backend_tests
        run_frontend_tests
        run_integration_tests
        generate_coverage
        ;;
    "backend")
        run_backend_tests
        ;;
    "frontend")
        run_frontend_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "coverage")
        generate_coverage
        ;;
    *)
        echo "Usage: $0 {all|backend|frontend|integration|coverage}"
        exit 1
        ;;
esac
