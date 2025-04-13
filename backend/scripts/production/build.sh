#!/bin/bash

# ======================================
# Harmonic Universe - Build Script
# ======================================
#
# This script builds the Harmonic Universe project for production.

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"
source "$SCRIPT_DIR/utils.sh"

# Get project root directory
ROOT_DIR=$(get_root_dir)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Function to build backend
build_backend() {
    log_info "Building backend..."
    
    # Change to backend directory
    cd "$BACKEND_DIR"
    
    # Activate virtual environment
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        log_error "Virtual environment not found. Please run setup.sh first."
        return 1
    fi
    
    # Install production dependencies
    log_info "Installing production dependencies..."
    pip install -r requirements.txt
    
    # Create .env.production if it doesn't exist
    if [ ! -f ".env.production" ]; then
        log_info "Creating .env.production file..."
        cp .env .env.production
        
        # Update values for production
        sed -i.bak 's/DEBUG=True/DEBUG=False/g' .env.production
        sed -i.bak 's/FLASK_ENV=development/FLASK_ENV=production/g' .env.production
        
        # Remove backup file
        rm -f .env.production.bak
    fi
    
    log_success "Backend build complete."
    return 0
}

# Function to build frontend
build_frontend() {
    log_info "Building frontend..."
    
    # Change to frontend directory
    cd "$FRONTEND_DIR"
    
    # Check for package.json
    if [ ! -f "package.json" ]; then
        log_error "Frontend package.json not found. Please run setup.sh first."
        return 1
    fi
    
    # Get package manager
    PM=$(get_package_manager ".")
    
    # Install dependencies
    log_info "Installing dependencies..."
    case "$PM" in
        pnpm)
            pnpm install --frozen-lockfile
            ;;
        yarn)
            yarn install --frozen-lockfile
            ;;
        npm)
            npm ci
            ;;
        *)
            log_error "Unknown package manager: $PM"
            return 1
            ;;
    esac
    
    # Build frontend
    log_info "Building frontend..."
    case "$PM" in
        pnpm)
            pnpm run build
            ;;
        yarn)
            yarn build
            ;;
        npm)
            npm run build
            ;;
        *)
            log_error "Unknown package manager: $PM"
            return 1
            ;;
    esac
    
    # Verify build
    if [ ! -d "dist" ] && [ ! -d "build" ]; then
        log_error "Frontend build failed. No build directory found."
        return 1
    fi
    
    log_success "Frontend build complete."
    return 0
}

# Function to build both
build_all() {
    log_info "Building all components..."
    
    # Build frontend
    build_frontend
    local frontend_result=$?
    
    # Build backend
    build_backend
    local backend_result=$?
    
    # Check results
    if [ $frontend_result -eq 0 ] && [ $backend_result -eq 0 ]; then
        log_success "Build completed successfully!"
        return 0
    else
        if [ $frontend_result -ne 0 ]; then
            log_error "Frontend build failed."
        fi
        
        if [ $backend_result -ne 0 ]; then
            log_error "Backend build failed."
        fi
        
        log_error "Build failed."
        return 1
    fi
}

# Function to clean build artifacts
clean_build() {
    log_info "Cleaning build artifacts..."
    
    # Clean frontend
    log_info "Cleaning frontend build..."
    cd "$FRONTEND_DIR"
    rm -rf dist build
    
    # Clean backend
    log_info "Cleaning backend build..."
    cd "$BACKEND_DIR"
    rm -rf __pycache__ *.pyc
    find . -name "__pycache__" -type d -exec rm -rf {} +
    find . -name "*.pyc" -delete
    
    log_success "Build artifacts cleaned successfully."
    return 0
}

# Main function
main() {
    print_banner
    
    # Process command line arguments
    local command="${1:-all}"
    
    case "$command" in
        backend)
            build_backend
            ;;
        frontend)
            build_frontend
            ;;
        all)
            build_all
            ;;
        clean)
            clean_build
            ;;
        help)
            log_info "Harmonic Universe Build Script"
            log_info "Usage: $0 <command>"
            log_info ""
            log_info "Commands:"
            log_info "  backend    Build backend only"
            log_info "  frontend   Build frontend only"
            log_info "  all        Build both backend and frontend"
            log_info "  clean      Clean build artifacts"
            log_info "  help       Show this help message"
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