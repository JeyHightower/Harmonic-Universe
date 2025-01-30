#!/bin/bash

echo "Running Harmonic Universe Test Suite"
echo "=================================="

# Function to check if command exists
command_exists () {
    type "$1" &> /dev/null ;
}

# Check for required commands
if ! command_exists python3 ; then
    echo "Error: python3 is required but not installed."
    exit 1
fi

if ! command_exists npm ; then
    echo "Error: npm is required but not installed."
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Initialize error flag
error=0

echo "Running Backend Tests..."
echo "----------------------"
cd backend
python3 -m pytest tests/ -v --cov=app --cov-report=term-missing --cov-report=html:coverage
backend_exit=$?
if [ $backend_exit -ne 0 ]; then
    echo -e "${RED}Backend tests failed${NC}"
    error=1
else
    echo -e "${GREEN}Backend tests passed${NC}"
fi
cd ..

echo ""
echo "Running Frontend Tests..."
echo "-----------------------"
cd frontend
npm test -- --coverage --watchAll=false
frontend_exit=$?
if [ $frontend_exit -ne 0 ]; then
    echo -e "${RED}Frontend tests failed${NC}"
    error=1
else
    echo -e "${GREEN}Frontend tests passed${NC}"
fi
cd ..

echo ""
echo "Test Suite Summary"
echo "================="
if [ $error -ne 0 ]; then
    echo -e "${RED}Some tests failed${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed successfully${NC}"
    exit 0
fi
