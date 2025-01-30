#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

echo -e "${BLUE}Setting up test environment...${NC}"

# Ensure we're in the backend directory
cd "$(dirname "$0")"

# Install test requirements if needed
if ! pip show pytest > /dev/null; then
    echo -e "${BLUE}Installing test requirements...${NC}"
    pip install pytest pytest-cov pytest-env
fi

# Run tests in order
echo -e "\n${BLUE}Running tests in order...${NC}"

# 1. Unit Tests (Models)
echo -e "\n${GREEN}Running Unit Tests...${NC}"
python -m pytest tests/unit/ -v || exit 1

# 2. Route Tests
echo -e "\n${GREEN}Running Route Tests...${NC}"
python -m pytest tests/test_routes/ -v || exit 1

# 3. Run all tests with coverage
echo -e "\n${GREEN}Running Complete Test Suite with Coverage...${NC}"
python -m pytest --cov=app --cov-report=term-missing tests/ || exit 1

echo -e "\n${GREEN}Test execution completed!${NC}"

