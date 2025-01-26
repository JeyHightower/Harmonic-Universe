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

# Start the backend server
cd backend
python run.py &
BACKEND_PID=$!

# Start the frontend server
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 10

# Run the tests
echo "Running backend tests..."
cd ../backend
python -m pytest tests/test_comprehensive.py -v

echo "Running frontend tests..."
cd ../frontend
npx cypress run --spec "cypress/e2e/comprehensive.cy.js"

# Cleanup
kill $BACKEND_PID
kill $FRONTEND_PID

echo -e "\n${GREEN}All tests completed successfully!${NC}"
