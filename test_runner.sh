#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Counter for test iterations
ITERATION=1
MAX_ITERATIONS=10

# Function to print section header
print_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 completed successfully${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

log() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

run_backend_tests() {
    print_header "Setting up Backend Environment"

    cd backend

    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        check_status "Virtual environment creation"
    fi

    # Activate virtual environment
    source venv/bin/activate
    check_status "Virtual environment activation"

    # Install dependencies
    pip install -r requirements.txt
    check_status "Backend dependencies installation"

    # Reset database for testing
    python reset_db.py
    check_status "Database reset"

    print_header "Running Backend Tests"

    # Run pytest with coverage
    python -m pytest tests/ -v --cov=app --cov-report=term-missing
    check_status "Backend tests"

    deactivate
    cd ..
}

run_frontend_tests() {
    print_header "Setting up Frontend Environment"

    cd frontend

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        npm install
        check_status "Frontend dependencies installation"
    fi

    print_header "Running Frontend Tests"

    # Run Jest tests
    npm test -- --coverage
    check_status "Frontend tests"

    cd ..
}

run_e2e_tests() {
    log "Running E2E tests..."
    cd frontend
    npm run cypress:run
    cd ..
}

check_database_migrations() {
    log "Checking database migrations..."
    cd backend
    flask db check
    flask db upgrade --check
    cd ..
}

run_health_checks() {
    log "Running health checks..."

    # Backend health check
    curl -f http://localhost:5001/api/health || {
        echo -e "${RED}Backend health check failed${NC}"
        return 1
    }

    # Frontend health check
    curl -f http://localhost:5174/ || {
        echo -e "${RED}Frontend health check failed${NC}"
        return 1
    }
}

verify_api_endpoints() {
    log "Verifying API endpoints..."

    # Get auth token
    TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"password"}' \
        | jq -r '.token')

    # Test protected endpoints
    curl -f -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/universes || {
        echo -e "${RED}API endpoint verification failed${NC}"
        return 1
    }
}

run_security_checks() {
    log "Running security checks..."

    # Check for common vulnerabilities
    cd backend
    safety check
    bandit -r app/
    cd ..

    cd frontend
    npm audit
    cd ..
}

run_performance_tests() {
    log "Running performance tests..."

    # Run Apache Bench tests
    ab -n 100 -c 10 http://localhost:5001/api/health
}

run_all_tests() {
    log "Starting test iteration $ITERATION of $MAX_ITERATIONS"

    run_backend_tests
    run_frontend_tests
    run_e2e_tests
    check_database_migrations
    run_health_checks
    verify_api_endpoints
    run_security_checks
    run_performance_tests

    log "Test iteration $ITERATION completed successfully"
}

# Main execution
print_header "Starting Test Suite"

# Ensure environment is set up
if [ ! -f ".env.render" ]; then
    echo -e "${RED}Error: .env.render file not found${NC}"
    exit 1
fi

# Load environment variables
source .env.render

# Run tests multiple times
while [ $ITERATION -le $MAX_ITERATIONS ]
do
    echo -e "\n${GREEN}=== Starting Iteration $ITERATION ===${NC}\n"

    run_all_tests

    # Check if any changes were made to the codebase
    if [ "$(git status --porcelain)" ]; then
        log "Changes detected in codebase, running tests again..."
        continue
    fi

    ITERATION=$((ITERATION + 1))
done

print_header "Test Suite Completed"
