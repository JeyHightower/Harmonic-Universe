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

# Start backend server in test mode
print_header "Starting Backend Server"
cd backend
source venv/bin/activate
export FLASK_ENV=testing
python run.py &
BACKEND_PID=$!
sleep 5 # Wait for backend to start
check_status "Backend server startup"

# Start frontend dev server
print_header "Starting Frontend Server"
cd ../frontend
npm run dev &
FRONTEND_PID=$!
sleep 10 # Wait for frontend to start
check_status "Frontend server startup"

# Run Cypress E2E tests
print_header "Running Cypress E2E Tests"
npm run test:e2e
check_status "Cypress E2E tests"

# Run k6 load tests
print_header "Running k6 Load Tests"
cd ../tests/k6

echo "Running API load tests..."
k6 run api.js
check_status "API load tests"

echo "Running WebSocket load tests..."
k6 run websocket.js
check_status "WebSocket load tests"

# Run stress tests
print_header "Running Stress Tests"
echo "Running API stress tests..."
k6 run api.js -e SCENARIO=stress
check_status "API stress tests"

echo "Running WebSocket stress tests..."
k6 run websocket.js -e SCENARIO=stress
check_status "WebSocket stress tests"

# Run spike tests
print_header "Running Spike Tests"
echo "Running API spike tests..."
k6 run api.js -e SCENARIO=spike
check_status "API spike tests"

echo "Running WebSocket spike tests..."
k6 run websocket.js -e SCENARIO=spike
check_status "WebSocket spike tests"

# Cleanup
print_header "Cleaning Up"
kill $BACKEND_PID
kill $FRONTEND_PID
deactivate

echo -e "\n${GREEN}All tests completed successfully!${NC}\n"
