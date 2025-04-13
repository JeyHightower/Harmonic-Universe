#!/bin/bash

# ======================================
# Harmonic Universe - Development Script
# ======================================
#
# This script starts the development servers for the Harmonic Universe project.

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"
source "$SCRIPT_DIR/utils.sh"

# Function to start backend
start_backend() {
    log_info "Starting backend development server..."
    
    # Get root and backend directories
    ROOT_DIR=$(get_root_dir)
    BACKEND_DIR="$ROOT_DIR/backend"
    
    # Check if Python virtual environment exists
    if [ ! -d "$BACKEND_DIR/venv" ]; then
        log_error "Python virtual environment not found. Please run setup.sh first."
        return 1
    fi
    
    # Change to backend directory
    cd "$BACKEND_DIR"
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Load environment variables
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    else
        log_warning ".env file not found. Using default environment variables."
    fi
    
    # Start Flask development server
    log_info "Starting Flask server on port ${PORT:-5001}..."
    python -m flask run --port=${PORT:-5001} --no-debugger
}

# Function to start frontend
start_frontend() {
    log_info "Starting frontend development server..."
    
    # Get root and frontend directories
    ROOT_DIR=$(get_root_dir)
    FRONTEND_DIR="$ROOT_DIR/frontend"
    
    # Check for package.json
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        log_error "Frontend package.json not found. Please run setup.sh first."
        return 1
    fi
    
    # Change to frontend directory
    cd "$FRONTEND_DIR"
    
    # Get package manager
    PM=$(get_package_manager ".")
    
    # Start development server
    case "$PM" in
        pnpm)
            pnpm run dev
            ;;
        yarn)
            yarn dev
            ;;
        npm)
            npm run dev
            ;;
        *)
            log_error "Unknown package manager: $PM"
            return 1
            ;;
    esac
}

# Function to start both servers
start_both() {
    log_info "Starting both backend and frontend servers..."
    
    # Get root directory
    ROOT_DIR=$(get_root_dir)
    
    # Start backend in background
    log_info "Starting backend server..."
    (cd "$ROOT_DIR" && ./scripts-new/dev.sh backend) &
    BACKEND_PID=$!
    
    # Give backend a moment to start
    sleep 2
    
    # Start frontend
    log_info "Starting frontend server..."
    (cd "$ROOT_DIR" && ./scripts-new/dev.sh frontend)
    
    # When frontend is stopped, stop backend
    log_info "Stopping backend server..."
    kill $BACKEND_PID
}

# Main function
main() {
    print_banner
    
    # Process command line arguments
    local target="${1:-both}"
    
    case "$target" in
        backend)
            start_backend
            ;;
        frontend)
            start_frontend
            ;;
        both)
            start_both
            ;;
        *)
            log_error "Unknown target: $target"
            log_info "Usage: $0 [backend|frontend|both]"
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 