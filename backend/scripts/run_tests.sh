#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section header
print_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Function to run tests with proper output
run_tests() {
    local category=$1
    local args=$2
    print_header "Running $category tests"
    pytest -v -m "$category" $args
    return $?
}

# Default values
COVERAGE=false
REPORT_XML=false
CATEGORY="all"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage)
            COVERAGE=true
            shift
            ;;
        --xml)
            REPORT_XML=true
            shift
            ;;
        --category=*)
            CATEGORY="${1#*=}"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Build pytest arguments
PYTEST_ARGS=""
if [ "$COVERAGE" = true ]; then
    PYTEST_ARGS="$PYTEST_ARGS --cov=app --cov-report=term-missing"
fi
if [ "$REPORT_XML" = true ]; then
    PYTEST_ARGS="$PYTEST_ARGS --junitxml=test-results.xml"
fi

# Run tests based on category
case $CATEGORY in
    "all")
        print_header "Running all tests"
        pytest -v $PYTEST_ARGS
        ;;
    "unit")
        run_tests "unit" "$PYTEST_ARGS"
        ;;
    "integration")
        run_tests "integration" "$PYTEST_ARGS"
        ;;
    "e2e")
        run_tests "e2e" "$PYTEST_ARGS"
        ;;
    "websocket")
        run_tests "websocket" "$PYTEST_ARGS"
        ;;
    *)
        echo -e "${RED}Invalid category: $CATEGORY${NC}"
        echo "Available categories: all, unit, integration, e2e, websocket"
        exit 1
        ;;
esac

# Check if tests passed
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed!${NC}"
    exit 1
fi
