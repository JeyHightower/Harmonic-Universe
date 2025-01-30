#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Error handling
set -e
trap 'echo -e "${RED}Tests failed${NC}" >&2' ERR

# Function to print section header
print_header() {
    echo -e "\n${YELLOW}=====================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}=====================================${NC}\n"
}

# Function to run backend tests
run_backend_tests() {
    print_header "Running Backend Tests"

    cd backend
    source venv/bin/activate || source venv/Scripts/activate

    # Install test dependencies if needed
    pip install -r requirements-test.txt

    # Run unit tests with coverage
    echo -e "${BLUE}Running Unit Tests${NC}"
    python -m pytest tests/unit -v --cov=app --cov-report=html --cov-report=term

    # Run integration tests
    echo -e "${BLUE}Running Integration Tests${NC}"
    python -m pytest tests/integration -v

    # Run WebSocket tests
    echo -e "${BLUE}Running WebSocket Tests${NC}"
    python -m pytest tests/websocket -v

    deactivate
    cd ..
}

# Function to run frontend tests
run_frontend_tests() {
    print_header "Running Frontend Tests"

    cd frontend

    # Install dependencies if needed
    yarn install

    # Run unit tests
    echo -e "${BLUE}Running Unit Tests${NC}"
    yarn test --coverage

    # Run integration tests
    echo -e "${BLUE}Running Integration Tests${NC}"
    yarn test:integration

    # Run E2E tests
    echo -e "${BLUE}Running E2E Tests${NC}"
    yarn cypress run

    cd ..
}

# Function to generate combined coverage report
generate_coverage_report() {
    print_header "Generating Coverage Report"

    # Create coverage directory if it doesn't exist
    mkdir -p coverage

    # Copy backend coverage
    cp -r backend/htmlcov coverage/backend

    # Copy frontend coverage
    cp -r frontend/coverage coverage/frontend

    echo -e "${GREEN}Coverage reports generated in ./coverage directory${NC}"
}

# Main execution
main() {
    # Ensure we're in the project root directory
    cd "$(dirname "$0")/.."

    print_header "Starting Test Suite"

    # Run backend tests
    run_backend_tests

    # Run frontend tests
    run_frontend_tests

    # Generate coverage report
    generate_coverage_report

    print_header "Test Suite Completed Successfully"
}

# Run main function
main

