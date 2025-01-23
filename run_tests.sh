#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Function to print section header
print_header() {
    echo -e "\n${GREEN}=== $1 ===${NC}\n"
}

# Function to check if previous command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 failed${NC}"
        return 1
    fi
}

# Install dependencies
print_header "Installing Dependencies"
cd backend && pip install -r requirements.txt && pip install -r requirements-test.txt
cd ../frontend && npm install

# Run backend tests
print_header "Running Backend Tests"
cd ../backend && pytest --cov=app --cov-report=term-missing
check_status "Backend tests" || exit 1

# Run frontend unit tests
print_header "Running Frontend Unit Tests"
cd ../frontend && npm test
check_status "Frontend unit tests" || exit 1

# Run end-to-end tests
print_header "Running End-to-End Tests"
npm run test:e2e
check_status "End-to-end tests" || exit 1

echo -e "\n${GREEN}All tests completed successfully!${NC}"
