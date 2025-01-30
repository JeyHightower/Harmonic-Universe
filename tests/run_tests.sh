#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "\n${GREEN}All tests completed successfully!${NC}"
