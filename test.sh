#!/bin/bash

# Harmonic Universe - Testing Script
# This script handles all testing-related operations

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
  echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}"
}

# Function to print success/error messages
print_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1${NC}"
  else
    echo -e "${RED}✗ $1${NC}"
    if [ ! -z "$2" ]; then
      echo -e "${YELLOW}$2${NC}"
    fi
    return 1
  fi
}

# Load environment variables
load_env() {
  if [ -f .env ]; then
    set -a
    source .env
    set +a
  else
    echo -e "${YELLOW}Warning: .env file not found, using default values${NC}"
  fi
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Run backend unit tests
run_backend_tests() {
  print_section "Running Backend Unit Tests"

  cd backend

  # Check if pytest is installed
  if ! command_exists pytest; then
    echo "Installing pytest..."
    pip install pytest pytest-cov
  fi

  # Reset test database before running tests
  echo "Resetting test database..."
  python scripts/reset_test_db.py
  print_result "Test database reset" "Failed to reset test database, tests may fail due to existing data."

  # Run tests with coverage
  echo "Running backend tests with coverage..."
  python -m pytest -v --cov=app tests/

  test_result=$?
  if [ $test_result -eq 0 ]; then
    echo -e "${GREEN}✓ All backend tests passed${NC}"
  else
    echo -e "${RED}✗ Some backend tests failed${NC}"
    cd ..
    return 1
  fi

  # Generate coverage report
  echo "Generating coverage report..."
  python -m pytest --cov=app --cov-report=html tests/
  print_result "Coverage report generation" "Failed to generate coverage report."

  echo -e "${CYAN}Coverage report available at: backend/htmlcov/index.html${NC}"
  cd ..
  return 0
}

# Run frontend unit tests
run_frontend_tests() {
  print_section "Running Frontend Unit Tests"

  cd frontend

  # Check if dependencies are installed
  if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    print_result "Frontend dependencies installation" "Failed to install frontend dependencies."
  fi

  # Run tests
  echo "Running frontend tests..."
  npm test

  test_result=$?
  if [ $test_result -eq 0 ]; then
    echo -e "${GREEN}✓ All frontend tests passed${NC}"
  else
    echo -e "${RED}✗ Some frontend tests failed${NC}"
    cd ..
    return 1
  fi

  # Run tests with coverage
  echo "Running frontend tests with coverage..."
  npm test -- --coverage
  print_result "Frontend test coverage" "Failed to generate coverage report."

  echo -e "${CYAN}Coverage report available at: frontend/coverage/lcov-report/index.html${NC}"
  cd ..
  return 0
}

# Run end-to-end tests
run_e2e_tests() {
  print_section "Running End-to-End Tests"

  # Check if Cypress is installed
  if [ ! -d "frontend/node_modules/cypress" ]; then
    echo "Installing Cypress..."
    cd frontend
    npm install cypress --save-dev
    cd ..
    print_result "Cypress installation" "Failed to install Cypress."
  fi

  # Reset test database before running tests
  echo "Resetting test database..."
  cd backend
  python scripts/reset_test_db.py
  print_result "Test database reset" "Failed to reset test database, tests may fail due to existing data."
  cd ..

  # Start backend server in background
  echo "Starting backend server..."
  cd backend
  export FLASK_ENV=testing
  python -m app.main &
  BACKEND_PID=$!
  cd ..

  # Wait for backend to start
  echo "Waiting for backend to start..."
  sleep 5

  # Start frontend server in background
  echo "Starting frontend server..."
  cd frontend
  npm run dev &
  FRONTEND_PID=$!
  cd ..

  # Wait for frontend to start
  echo "Waiting for frontend to start..."
  sleep 5

  # Run Cypress tests
  echo "Running Cypress tests..."
  cd frontend
  npx cypress run

  test_result=$?
  if [ $test_result -eq 0 ]; then
    echo -e "${GREEN}✓ All end-to-end tests passed${NC}"
  else
    echo -e "${RED}✗ Some end-to-end tests failed${NC}"
  fi

  cd ..

  # Kill background processes
  echo "Cleaning up background processes..."
  kill $BACKEND_PID
  kill $FRONTEND_PID

  return $test_result
}

# Run API tests
run_api_tests() {
  print_section "Running API Tests"

  cd backend

  # Check if pytest is installed
  if ! command_exists pytest; then
    echo "Installing pytest..."
    pip install pytest requests
  fi

  # Reset test database before running tests
  echo "Resetting test database..."
  python scripts/reset_test_db.py
  print_result "Test database reset" "Failed to reset test database, tests may fail due to existing data."

  # Start backend server in background
  echo "Starting backend server for API tests..."
  export FLASK_ENV=testing
  python -m app.main &
  API_PID=$!

  # Wait for backend to start
  echo "Waiting for backend to start..."
  sleep 5

  # Run API tests
  echo "Running API tests..."
  python -m pytest tests/api/

  test_result=$?
  if [ $test_result -eq 0 ]; then
    echo -e "${GREEN}✓ All API tests passed${NC}"
  else
    echo -e "${RED}✗ Some API tests failed${NC}"
  fi

  # Kill background process
  echo "Cleaning up background processes..."
  kill $API_PID

  cd ..
  return $test_result
}

# Run integration tests
run_integration_tests() {
  print_section "Running Integration Tests"

  cd backend

  # Check if pytest is installed
  if ! command_exists pytest; then
    echo "Installing pytest..."
    pip install pytest
  fi

  # Reset test database before running tests
  echo "Resetting test database..."
  python scripts/reset_test_db.py
  print_result "Test database reset" "Failed to reset test database, tests may fail due to existing data."

  # Run integration tests
  echo "Running integration tests..."
  python -m pytest tests/integration/

  test_result=$?
  if [ $test_result -eq 0 ]; then
    echo -e "${GREEN}✓ All integration tests passed${NC}"
  else
    echo -e "${RED}✗ Some integration tests failed${NC}"
  fi

  cd ..
  return $test_result
}

# Run linting
run_linting() {
  print_section "Running Linting"

  # Backend linting
  echo "Running backend linting..."
  cd backend

  # Check if flake8 is installed
  if ! command_exists flake8; then
    echo "Installing flake8..."
    pip install flake8
  fi

  flake8 app/ tests/
  print_result "Backend linting" "Backend code has linting errors."
  cd ..

  # Frontend linting
  echo "Running frontend linting..."
  cd frontend

  # Check if dependencies are installed
  if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
  fi

  npm run lint
  print_result "Frontend linting" "Frontend code has linting errors."
  cd ..

  return 0
}

# Run all tests
run_all_tests() {
  print_section "Running All Tests"

  # Run all test types
  run_linting
  linting_result=$?

  run_backend_tests
  backend_result=$?

  run_frontend_tests
  frontend_result=$?

  run_integration_tests
  integration_result=$?

  run_api_tests
  api_result=$?

  run_e2e_tests
  e2e_result=$?

  # Print summary
  print_section "Test Summary"

  if [ $linting_result -eq 0 ]; then
    echo -e "${GREEN}✓ Linting: Passed${NC}"
  else
    echo -e "${RED}✗ Linting: Failed${NC}"
  fi

  if [ $backend_result -eq 0 ]; then
    echo -e "${GREEN}✓ Backend Tests: Passed${NC}"
  else
    echo -e "${RED}✗ Backend Tests: Failed${NC}"
  fi

  if [ $frontend_result -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend Tests: Passed${NC}"
  else
    echo -e "${RED}✗ Frontend Tests: Failed${NC}"
  fi

  if [ $integration_result -eq 0 ]; then
    echo -e "${GREEN}✓ Integration Tests: Passed${NC}"
  else
    echo -e "${RED}✗ Integration Tests: Failed${NC}"
  fi

  if [ $api_result -eq 0 ]; then
    echo -e "${GREEN}✓ API Tests: Passed${NC}"
  else
    echo -e "${RED}✗ API Tests: Failed${NC}"
  fi

  if [ $e2e_result -eq 0 ]; then
    echo -e "${GREEN}✓ End-to-End Tests: Passed${NC}"
  else
    echo -e "${RED}✗ End-to-End Tests: Failed${NC}"
  fi

  # Calculate overall result
  overall_result=$(( linting_result + backend_result + frontend_result + integration_result + api_result + e2e_result ))

  if [ $overall_result -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}All tests passed successfully!${NC}"
    return 0
  else
    echo -e "\n${RED}${BOLD}Some tests failed. Please check the logs above for details.${NC}"
    return 1
  fi
}

# Print usage information
print_usage() {
  echo -e "${BOLD}Harmonic Universe - Testing Script${NC}"
  echo -e "Usage: $0 <command>"
  echo
  echo -e "${BOLD}Commands:${NC}"
  echo -e "  backend       Run backend unit tests"
  echo -e "  frontend      Run frontend unit tests"
  echo -e "  e2e           Run end-to-end tests"
  echo -e "  api           Run API tests"
  echo -e "  integration   Run integration tests"
  echo -e "  lint          Run linting"
  echo -e "  all           Run all tests"
  echo
  echo -e "${BOLD}Examples:${NC}"
  echo -e "  $0 backend    Run only backend tests"
  echo -e "  $0 all        Run all tests"
}

# Main function
main() {
  # Load environment variables
  load_env

  if [ $# -eq 0 ]; then
    print_usage
    exit 1
  fi

  command=$1

  case $command in
    backend)
      run_backend_tests
      ;;
    frontend)
      run_frontend_tests
      ;;
    e2e)
      run_e2e_tests
      ;;
    api)
      run_api_tests
      ;;
    integration)
      run_integration_tests
      ;;
    lint)
      run_linting
      ;;
    all)
      run_all_tests
      ;;
    *)
      print_usage
      exit 1
      ;;
  esac

  exit $?
}

# Execute main function
main "$@"
