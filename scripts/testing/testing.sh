#!/bin/bash
# testing.sh - Comprehensive Test Suite for Harmonic Universe
# This script consolidates all testing functionality for the Harmonic Universe application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_URL="http://localhost:5001"

# ANSI color codes for output formatting
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# API test credentials and IDs
TEST_EMAIL="test@example.com"
TEST_PASSWORD="TestPass123!"
AUTH_TOKEN=""
TEST_UNIVERSE_ID=""
TEST_SCENE_ID=""
TEST_CHARACTER_ID=""

# Print functions
print_banner() {
    echo -e "${BLUE}=============================================${NC}"
    echo -e "${BLUE}    Harmonic Universe Testing Suite    ${NC}"
    echo -e "${BLUE}=============================================${NC}"
}

print_test() {
    echo -e "\n${BLUE}Testing: $1${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Utility to check response codes
check_response() {
    local expected_status=$1
    local actual_status=$2
    local test_name=$3
    
    if [ "$actual_status" -eq "$expected_status" ]; then
        log_success "$test_name - Status: $actual_status"
    else
        log_error "$test_name - Expected: $expected_status, Got: $actual_status"
    fi
}

# Directory and environment checks
check_backend_env() {
    log_info "Checking backend environment..."
    
    if [ ! -d "$BACKEND_DIR/venv" ]; then
        log_error "Backend virtual environment not found. Please run setup.sh first."
        return 1
    fi
    log_success "Backend environment found."
}

check_frontend_deps() {
    log_info "Checking frontend dependencies..."
    
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        log_error "Frontend dependencies not found. Please run setup.sh first."
        return 1
    fi
    log_success "Frontend dependencies found."
}

# Check if required tools are installed
check_tools() {
    log_info "Checking required tools..."
    
    # Check for curl
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed. Please install curl and try again."
        return 1
    fi
    log_success "curl is installed."
    
    # Check for jq (optional but helpful)
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed. Some tests may not work optimally."
        log_warning "Install jq for better testing: https://stedolan.github.io/jq/download/"
    else
        log_success "jq is installed."
    fi
}

# Check if backend server is running
check_backend_server() {
    log_info "Checking if backend server is running..."
    
    curl -s "$BACKEND_URL/api/ping" > /dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Backend server is running."
    else
        log_error "Backend server is not running. Please start the server and try again."
        return 1
    fi
}

# Function to run backend tests
run_backend_tests() {
    log_info "Running backend tests..."
    
    # Change to backend directory
    cd "$BACKEND_DIR"
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Run tests
    local test_path="${1:-.}"
    log_info "Running tests in path: $test_path"
    
    python -m pytest "$test_path" -v
    local test_result=$?
    
    if [ $test_result -eq 0 ]; then
        log_success "Backend tests passed!"
    else
        log_error "Backend tests failed."
        return 1
    fi
    
    return 0
}

# Function to run frontend tests
run_frontend_tests() {
    log_info "Running frontend tests..."
    
    # Change to frontend directory
    cd "$FRONTEND_DIR"
    
    # Run Jest tests
    npm test
    
    local test_result=$?
    if [ $test_result -eq 0 ]; then
        log_success "Frontend tests passed."
    else
        log_error "Frontend tests failed with exit code $test_result."
        return $test_result
    fi
}

# Run linting checks
run_linting() {
    log_info "Running linting checks..."
    
    # Backend linting
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    if command -v flake8 &> /dev/null; then
        log_info "Running flake8 for backend..."
        flake8 .
        
        local backend_lint_code=$?
        if [ $backend_lint_code -eq 0 ]; then
            log_success "Backend linting passed."
        else
            log_error "Backend linting failed."
        fi
    else
        log_warning "flake8 not found. Skipping backend linting."
    fi
    
    # Frontend linting
    cd "$FRONTEND_DIR"
    
    log_info "Running ESLint for frontend..."
    npm run lint
    
    local frontend_lint_code=$?
    if [ $frontend_lint_code -eq 0 ]; then
        log_success "Frontend linting passed."
    else
        log_error "Frontend linting failed."
        return $frontend_lint_code
    fi
}

# Auth API Tests
run_auth_tests() {
    log_info "Running authentication API tests..."
    
    # Check if backend server is running
    check_backend_server || return 1
    
    # Base URL for the API
    AUTH_URL="$BACKEND_URL/api/auth"
    
    # Test 1: Register new user
    print_test "Register new user"
    RESPONSE=$(curl -s -w "%{http_code}" -X POST "$AUTH_URL/register" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "testuser",
            "email": "test@example.com",
            "password": "TestPass123!"
        }')
    STATUS=${RESPONSE: -3}
    BODY=${RESPONSE:0:${#RESPONSE}-3}
    check_response 201 "$STATUS" "Register new user"
    if [ "$STATUS" -eq 201 ]; then
        AUTH_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    fi

    # Test 2: Register with duplicate username
    print_test "Register with duplicate username"
    RESPONSE=$(curl -s -w "%{http_code}" -X POST "$AUTH_URL/register" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "testuser",
            "email": "different@example.com",
            "password": "TestPass123!"
        }')
    STATUS=${RESPONSE: -3}
    check_response 409 "$STATUS" "Register with duplicate username"

    # Test 3: Login with valid credentials
    print_test "Login with valid credentials"
    RESPONSE=$(curl -s -w "%{http_code}" -X POST "$AUTH_URL/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "test@example.com",
            "password": "TestPass123!"
        }')
    STATUS=${RESPONSE: -3}
    BODY=${RESPONSE:0:${#RESPONSE}-3}
    check_response 200 "$STATUS" "Login with valid credentials"
    if [ "$STATUS" -eq 200 ]; then
        AUTH_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    fi

    # Test 4: Get current user with valid token
    print_test "Get current user with valid token"
    RESPONSE=$(curl -s -w "%{http_code}" -X GET "$AUTH_URL/me" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    STATUS=${RESPONSE: -3}
    check_response 200 "$STATUS" "Get current user with valid token"

    # Test 5: Logout with valid token
    print_test "Logout with valid token"
    RESPONSE=$(curl -s -w "%{http_code}" -X POST "$AUTH_URL/logout" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    STATUS=${RESPONSE: -3}
    check_response 200 "$STATUS" "Logout with valid token"
    
    return 0
}

# API Integration Tests
run_api_integration_tests() {
    log_info "Running API integration tests..."
    
    # Check if backend server is running
    check_backend_server || return 1
    
    # Register test user and get token
    log_info "Setting up test user..."
    RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"apitester\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    if [[ $RESPONSE == *"token"* ]]; then
        log_success "Test user setup successful."
        if command -v jq &> /dev/null; then
            AUTH_TOKEN=$(echo $RESPONSE | jq -r '.token')
        else
            AUTH_TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
        fi
    else
        # Try login if registration fails (user might already exist)
        RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
        
        if [[ $RESPONSE == *"token"* ]]; then
            log_success "Test user login successful."
            if command -v jq &> /dev/null; then
                AUTH_TOKEN=$(echo $RESPONSE | jq -r '.token')
            else
                AUTH_TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
            fi
        else
            log_error "Failed to setup test user."
            log_error "Response: $RESPONSE"
            return 1
        fi
    fi
    
    # Test universe creation
    print_test "Creating test universe"
    RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/universes" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "{\"name\":\"Test Universe\",\"description\":\"A test universe\",\"physics_parameters\":{\"gravity\":9.8,\"friction\":0.1}}")
    
    if [[ $RESPONSE == *"\"name\":\"Test Universe\""* ]]; then
        log_success "Universe creation successful."
        if command -v jq &> /dev/null; then
            TEST_UNIVERSE_ID=$(echo $RESPONSE | jq -r '.id')
        else
            TEST_UNIVERSE_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
        fi
        log_info "Universe ID: $TEST_UNIVERSE_ID"
    else
        log_error "Universe creation failed."
        log_error "Response: $RESPONSE"
        return 1
    fi
    
    # Test scene creation
    print_test "Creating test scene"
    RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/scenes" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "{\"name\":\"Test Scene\",\"description\":\"A test scene\",\"universe_id\":$TEST_UNIVERSE_ID}")
    
    if [[ $RESPONSE == *"\"name\":\"Test Scene\""* ]]; then
        log_success "Scene creation successful."
        if command -v jq &> /dev/null; then
            TEST_SCENE_ID=$(echo $RESPONSE | jq -r '.id')
        else
            TEST_SCENE_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
        fi
        log_info "Scene ID: $TEST_SCENE_ID"
    else
        log_error "Scene creation failed."
        log_error "Response: $RESPONSE"
        return 1
    fi
    
    # Cleanup test data
    log_info "Cleaning up test data..."
    
    # Delete scene if created
    if [ ! -z "$TEST_SCENE_ID" ]; then
        curl -s -X DELETE "$BACKEND_URL/api/scenes/$TEST_SCENE_ID" \
            -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null
        log_success "Test scene deleted."
    fi
    
    # Delete universe if created
    if [ ! -z "$TEST_UNIVERSE_ID" ]; then
        curl -s -X DELETE "$BACKEND_URL/api/universes/$TEST_UNIVERSE_ID" \
            -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null
        log_success "Test universe deleted."
    fi
    
    return 0
}

# Main function to run all tests or specific categories
main() {
    print_banner
    
    # Process command line arguments
    local command="${1:-all}"
    local arg="$2"
    
    # Check required tools
    check_tools
    
    case "$command" in
        auth)
            run_auth_tests
            ;;
        api)
            run_api_integration_tests
            ;;
        backend)
            check_backend_env && run_backend_tests "$arg"
            ;;
        frontend)
            check_frontend_deps && run_frontend_tests
            ;;
        lint)
            run_linting
            ;;
        all)
            # Run all tests
            check_backend_env
            check_frontend_deps
            run_linting
            run_backend_tests
            run_frontend_tests
            run_auth_tests
            run_api_integration_tests
            ;;
        help)
            log_info "Harmonic Universe Testing Suite"
            log_info "Usage: $0 <command> [arg]"
            log_info ""
            log_info "Commands:"
            log_info "  auth            Run authentication API tests"
            log_info "  api             Run API integration tests"
            log_info "  backend [path]  Run backend tests (optional path)"
            log_info "  frontend        Run frontend tests"
            log_info "  lint            Run linting checks"
            log_info "  all             Run all tests (default)"
            log_info "  help            Show this help message"
            ;;
        *)
            log_error "Unknown command: $command"
            log_info "Run '$0 help' for usage information."
            exit 1
            ;;
    esac
    
    # Print summary
    log_info "Test Results:"
    log_info "  Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
    log_info "  Tests Failed: ${RED}$TESTS_FAILED${NC}"
    
    # Return exit code based on test results
    if [ "$TESTS_FAILED" -eq 0 ]; then
        log_success "All tests completed successfully!"
        return 0
    else
        log_error "Some tests failed."
        return 1
    fi
}

# Run main function with all arguments
main "$@" 