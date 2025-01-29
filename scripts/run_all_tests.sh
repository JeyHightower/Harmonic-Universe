#!/bin/bash

# Script to run all tests in logical order

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set up Python path
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Function to print section header
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to run tests and check result
run_test() {
    local test_name=$1
    local test_command=$2

    echo -e "${YELLOW}Running $test_name...${NC}"
    eval $test_command

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $test_name passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $test_name failed${NC}"
        return 1
    fi
}

# Start test execution
print_header "Starting Test Suite Execution"
echo "Time: $(date)"
echo "Node version: $(node --version)"
echo "Python version: $(python --version)"
echo "PYTHONPATH: $PYTHONPATH"

# Initialize test results
declare -a test_names=()
declare -a test_results=()

# 1. Backend Unit Tests
print_header "Backend Unit Tests"

# Models
run_test "User Model Tests" "pytest tests/backend/unit/test_user.py -v"
test_names+=("User Model")
test_results+=($?)

run_test "Universe Model Tests" "pytest tests/backend/unit/test_universe.py -v"
test_names+=("Universe Model")
test_results+=($?)

run_test "Storyboard Model Tests" "pytest tests/backend/unit/test_storyboard.py -v"
test_names+=("Storyboard Model")
test_results+=($?)

# Routes
run_test "Auth Route Tests" "pytest tests/backend/routes/test_auth.py -v"
test_names+=("Auth Routes")
test_results+=($?)

run_test "User Route Tests" "pytest tests/backend/routes/test_user.py -v"
test_names+=("User Routes")
test_results+=($?)

run_test "Universe Route Tests" "pytest tests/backend/routes/test_universe.py -v"
test_names+=("Universe Routes")
test_results+=($?)

run_test "Storyboard Route Tests" "pytest tests/backend/routes/test_storyboard.py -v"
test_names+=("Storyboard Routes")
test_results+=($?)

# 2. Frontend Unit Tests
print_header "Frontend Unit Tests"

# Components
run_test "Auth Component Tests" "cd frontend && npm run test src/__tests__/components/Auth -- --run"
test_names+=("Auth Components")
test_results+=($?)
cd ..

run_test "Universe Component Tests" "cd frontend && npm run test src/__tests__/components/Universe -- --run"
test_names+=("Universe Components")
test_results+=($?)
cd ..

run_test "Storyboard Component Tests" "cd frontend && npm run test src/__tests__/components/Storyboard -- --run"
test_names+=("Storyboard Components")
test_results+=($?)
cd ..

# Pages
run_test "Page Tests" "cd frontend && npm run test src/__tests__/pages -- --run"
test_names+=("Pages")
test_results+=($?)
cd ..

# Hooks
run_test "Custom Hooks Tests" "cd frontend && npm run test src/__tests__/hooks -- --run"
test_names+=("Custom Hooks")
test_results+=($?)
cd ..

# 3. Integration Tests
print_header "Integration Tests"

run_test "API Integration Tests" "pytest tests/integration/test_api.py -v"
test_names+=("API Integration")
test_results+=($?)

run_test "Frontend Integration Tests" "cd frontend && npm run test src/__tests__/integration -- --run"
test_names+=("Frontend Integration")
test_results+=($?)
cd ..

# 4. E2E Tests
print_header "End-to-End Tests"

run_test "E2E Tests" "cd frontend && npx cypress run"
test_names+=("E2E")
test_results+=($?)
cd ..

# Generate test report
print_header "Test Results Summary"

# Calculate statistics
total_tests=${#test_names[@]}
passed_tests=0
failed_tests=0

echo -e "\nDetailed Results:"
echo -e "----------------"

for i in "${!test_names[@]}"; do
    if [ ${test_results[$i]} -eq 0 ]; then
        echo -e "${GREEN}✓ ${test_names[$i]}${NC}"
        ((passed_tests++))
    else
        echo -e "${RED}✗ ${test_names[$i]}${NC}"
        ((failed_tests++))
    fi
done

# Print summary
echo -e "\nSummary:"
echo -e "--------"
echo -e "Total Tests: $total_tests"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$failed_tests${NC}"
echo -e "Success Rate: $(( (passed_tests * 100) / total_tests ))%"

# Generate test report file
report_file="test_report_$(date +%Y%m%d_%H%M%S).txt"
{
    echo "Test Report"
    echo "==========="
    echo "Date: $(date)"
    echo "Environment:"
    echo "  - Node: $(node --version)"
    echo "  - Python: $(python --version)"
    echo "  - PYTHONPATH: $PYTHONPATH"
    echo ""
    echo "Results:"
    for i in "${!test_names[@]}"; do
        if [ ${test_results[$i]} -eq 0 ]; then
            echo "✓ ${test_names[$i]}: Passed"
        else
            echo "✗ ${test_names[$i]}: Failed"
        fi
    done
    echo ""
    echo "Summary:"
    echo "  - Total Tests: $total_tests"
    echo "  - Passed: $passed_tests"
    echo "  - Failed: $failed_tests"
    echo "  - Success Rate: $(( (passed_tests * 100) / total_tests ))%"
} > "$report_file"

echo -e "\nDetailed test report saved to: $report_file"

# Exit with error if any tests failed
if [ $failed_tests -gt 0 ]; then
    exit 1
fi

exit 0

