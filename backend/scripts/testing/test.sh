#!/bin/bash

# ======================================
# Harmonic Universe - Test Runner
# ======================================
#
# This script runs tests for the Harmonic Universe project.

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"
source "$SCRIPT_DIR/utils.sh"

# Get project root directory
ROOT_DIR=$(get_root_dir)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Function to run backend tests
run_backend_tests() {
    log_info "Running backend tests..."
    
    # Change to backend directory
    cd "$BACKEND_DIR"
    
    # Activate virtual environment
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        log_error "Virtual environment not found. Please run setup.sh first."
        return 1
    fi
    
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

# Function to run API tests
run_api_tests() {
    log_info "Running API tests..."
    
    # Change to root directory
    cd "$ROOT_DIR"
    
    # Check if API test script exists
    if [ -f "api_test.py" ]; then
        # Activate virtual environment
        if [ -d "$BACKEND_DIR/venv" ]; then
            source "$BACKEND_DIR/venv/bin/activate"
        else
            log_error "Virtual environment not found. Please run setup.sh first."
            return 1
        fi
        
        # Run tests
        python api_test.py
        local test_result=$?
        
        if [ $test_result -eq 0 ]; then
            log_success "API tests passed!"
        else
            log_error "API tests failed."
            return 1
        fi
    else
        log_error "API test script not found: api_test.py"
        return 1
    fi
    
    return 0
}

# Function to run frontend tests
run_frontend_tests() {
    log_info "Running frontend tests..."
    
    # Change to frontend directory
    cd "$FRONTEND_DIR"
    
    # Check for package.json
    if [ ! -f "package.json" ]; then
        log_error "Frontend package.json not found. Please run setup.sh first."
        return 1
    fi
    
    # Get package manager
    PM=$(get_package_manager ".")
    
    # Run tests
    case "$PM" in
        pnpm)
            pnpm test
            ;;
        yarn)
            yarn test
            ;;
        npm)
            npm test
            ;;
        *)
            log_error "Unknown package manager: $PM"
            return 1
            ;;
    esac
    
    local test_result=$?
    
    if [ $test_result -eq 0 ]; then
        log_success "Frontend tests passed!"
    else
        log_error "Frontend tests failed."
        return 1
    fi
    
    return 0
}

# Function to run end-to-end tests
run_e2e_tests() {
    log_info "Running end-to-end tests..."
    
    # Change to frontend directory
    cd "$FRONTEND_DIR"
    
    # Check for package.json
    if [ ! -f "package.json" ]; then
        log_error "Frontend package.json not found. Please run setup.sh first."
        return 1
    fi
    
    # Get package manager
    PM=$(get_package_manager ".")
    
    # Run e2e tests
    case "$PM" in
        pnpm)
            pnpm run test:e2e
            ;;
        yarn)
            yarn test:e2e
            ;;
        npm)
            npm run test:e2e
            ;;
        *)
            log_error "Unknown package manager: $PM"
            return 1
            ;;
    esac
    
    local test_result=$?
    
    if [ $test_result -eq 0 ]; then
        log_success "End-to-end tests passed!"
    else
        log_error "End-to-end tests failed."
        return 1
    fi
    
    return 0
}

# Function to run all tests
run_all_tests() {
    log_info "Running all tests..."
    
    local backend_result=0
    local api_result=0
    local frontend_result=0
    local e2e_result=0
    
    # Run backend tests
    run_backend_tests
    backend_result=$?
    
    # Run API tests
    run_api_tests
    api_result=$?
    
    # Run frontend tests
    run_frontend_tests
    frontend_result=$?
    
    # Run e2e tests
    run_e2e_tests
    e2e_result=$?
    
    # Report results
    log_info "Test Results:"
    log_info "  Backend tests: $([ $backend_result -eq 0 ] && echo "PASSED" || echo "FAILED")"
    log_info "  API tests: $([ $api_result -eq 0 ] && echo "PASSED" || echo "FAILED")"
    log_info "  Frontend tests: $([ $frontend_result -eq 0 ] && echo "PASSED" || echo "FAILED")"
    log_info "  End-to-end tests: $([ $e2e_result -eq 0 ] && echo "PASSED" || echo "FAILED")"
    
    # Return overall result
    if [ $backend_result -eq 0 ] && [ $api_result -eq 0 ] && [ $frontend_result -eq 0 ] && [ $e2e_result -eq 0 ]; then
        log_success "All tests passed!"
        return 0
    else
        log_error "Some tests failed."
        return 1
    fi
}

# Main function
main() {
    print_banner
    
    # Process command line arguments
    local command="${1:-all}"
    local arg="$2"
    
    case "$command" in
        backend)
            run_backend_tests "$arg"
            ;;
        api)
            run_api_tests
            ;;
        frontend)
            run_frontend_tests
            ;;
        e2e)
            run_e2e_tests
            ;;
        all)
            run_all_tests
            ;;
        help)
            log_info "Harmonic Universe Test Runner"
            log_info "Usage: $0 <command> [arg]"
            log_info ""
            log_info "Commands:"
            log_info "  backend [path]  Run backend tests (optional path)"
            log_info "  api             Run API tests"
            log_info "  frontend        Run frontend tests"
            log_info "  e2e             Run end-to-end tests"
            log_info "  all             Run all tests"
            log_info "  help            Show this help message"
            ;;
        *)
            log_error "Unknown command: $command"
            log_info "Use '$0 help' for usage information."
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 