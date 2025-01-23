#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to check if a command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 completed successfully${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Clean up function
cleanup() {
    print_header "Cleaning Up"

    # Stop backend server
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi

    # Stop frontend server
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi

    # Remove temporary files
    rm -rf coverage/
    rm -rf .coverage
    rm -rf test-results/
    rm -rf cypress/screenshots/
    rm -rf cypress/videos/
}

# Set up trap for cleanup
trap cleanup EXIT

# Create results directory
mkdir -p test-results

# Backend Tests
print_header "Running Backend Tests"

# Activate virtual environment if it exists
if [ -d "backend/venv" ]; then
    source backend/venv/bin/activate
fi

# Load test environment variables
if [ -f "backend/.env.test" ]; then
    export $(cat backend/.env.test | xargs)
fi

# Run unit tests
print_header "Running Backend Unit Tests"
cd backend && python -m pytest tests/unit -v --cov=app --cov-report=xml -v
check_status "Backend unit tests"

# Run integration tests
print_header "Running Backend Integration Tests"
cd backend && python -m pytest tests/integration -v
check_status "Backend integration tests"

# Run API tests
print_header "Running API Tests"
pytest tests/api -v --junitxml=../test-results/api.xml
check_status "API tests"

# Generate coverage report
print_header "Generating Backend Coverage Report"
coverage run -m pytest
coverage report
coverage html -d ../test-results/backend-coverage
check_status "Backend coverage report"

cd ..

# Frontend Tests
print_header "Running Frontend Tests"

cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    npm install
fi

# Run unit tests
print_header "Running Frontend Unit Tests"
npm run test:unit -- --coverage
check_status "Frontend unit tests"

# Run integration tests
print_header "Running Frontend Integration Tests"
npm run test:integration
check_status "Frontend integration tests"

# Start servers for E2E tests
print_header "Starting Servers for E2E Tests"

# Start backend server
cd ../backend
export FLASK_ENV=testing
python run.py &
BACKEND_PID=$!
sleep 5 # Wait for backend to start
check_status "Backend server startup"

# Start frontend dev server
cd ../frontend
npm run dev &
FRONTEND_PID=$!
sleep 10 # Wait for frontend to start
check_status "Frontend server startup"

# Run E2E tests
print_header "Running E2E Tests"
npm run test:e2e
check_status "E2E tests"

# Run performance tests
print_header "Running Performance Tests"
cd ../tests/k6

echo "Running API load tests..."
k6 run api.js
check_status "API load tests"

echo "Running WebSocket load tests..."
k6 run websocket.js
check_status "WebSocket load tests"

# Generate combined test report
print_header "Generating Test Report"

cd ../..
echo "Test Results Summary" > test-results/summary.txt
echo "===================" >> test-results/summary.txt
echo "" >> test-results/summary.txt

# Add backend test results
echo "Backend Tests:" >> test-results/summary.txt
grep "failed" test-results/backend-unit.xml | tail -n 1 >> test-results/summary.txt
grep "failed" test-results/backend-integration.xml | tail -n 1 >> test-results/summary.txt
grep "failed" test-results/api.xml | tail -n 1 >> test-results/summary.txt

# Add frontend test results
echo "" >> test-results/summary.txt
echo "Frontend Tests:" >> test-results/summary.txt
cat frontend/coverage/coverage-summary.json >> test-results/summary.txt

# Add E2E test results
echo "" >> test-results/summary.txt
echo "E2E Tests:" >> test-results/summary.txt
cat test-results/e2e-results.json >> test-results/summary.txt

print_header "Test Execution Complete"
echo "See test-results directory for detailed reports"

echo -e "\n=== Cleaning Up ===\n"
deactivate 2>/dev/null
