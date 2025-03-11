#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
YELLOW='\033[1;33m'

# Function to print section header
print_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Function to run tests and check result
run_test() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 tests passed${NC}"
    else
        echo -e "${RED}✗ $1 tests failed${NC}"
        exit 1
    fi
}

echo -e "${BLUE}Setting up test environment...${NC}"

# Ensure we're in the project root directory
cd "$(dirname "$0")/.."

# Install test requirements if needed
if ! pip show pytest > /dev/null; then
    echo -e "${BLUE}Installing test requirements...${NC}"
    pip install -r backend/requirements-test.txt
fi

# Run backend tests
echo -e "\n${GREEN}Running Backend Tests...${NC}"

# 1. Unit Tests
echo -e "\n${BLUE}Running Backend Unit Tests...${NC}"
python -m pytest tests/unit/backend -v --cov=backend/app || exit 1

# 2. Integration Tests
echo -e "\n${BLUE}Running Backend Integration Tests...${NC}"
python -m pytest tests/integration/backend -v || exit 1

# Run frontend tests
echo -e "\n${GREEN}Running Frontend Tests...${NC}"

# 1. Unit Tests
echo -e "\n${BLUE}Running Frontend Unit Tests...${NC}"
cd frontend && yarn test || exit 1

# 2. E2E Tests
echo -e "\n${BLUE}Running Frontend E2E Tests...${NC}"
yarn cypress run || exit 1

cd ..

# Generate coverage report
echo -e "\n${GREEN}Generating Coverage Report...${NC}"
python -m pytest --cov=backend/app --cov-report=html tests/

# Parse command line arguments
TEST_TYPE=$1

case $TEST_TYPE in
    "unit")
        print_header "Running Unit Tests"
        pytest tests/unit -v
        run_test "Unit"
        ;;
    "integration")
        print_header "Running Integration Tests"
        pytest tests/integration -v
        run_test "Integration"
        ;;
    "e2e")
        print_header "Running E2E Tests"
        pytest tests/e2e -v
        run_test "E2E"
        ;;
    "all")
        print_header "Running All Tests"
        pytest tests -v
        run_test "All"
        ;;
    *)
        echo "Usage: $0 [unit|integration|e2e|all]"
        echo "  unit        - Run unit tests only"
        echo "  integration - Run integration tests only"
        echo "  e2e         - Run end-to-end tests only"
        echo "  all         - Run all tests"
        exit 1
        ;;
esac

echo -e "\n${GREEN}All tests completed successfully!${NC}"
