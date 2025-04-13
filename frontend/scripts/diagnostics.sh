#!/bin/bash

# =========================================
# Harmonic Universe - Frontend Diagnostics
# =========================================
#
# This script diagnoses common issues with the frontend

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROOT_DIR")"

# Source core utilities
source "$PROJECT_ROOT/scripts/core.sh"
source "$PROJECT_ROOT/scripts/utils.sh"

# Welcome message
print_banner
log_info "Harmonic Universe Frontend Diagnostics"

# Function to check for common issues
diagnose_frontend() {
    log_info "Running frontend diagnostics..."
    
    # Change to frontend directory
    cd "$ROOT_DIR"
    
    # 1. Check for node_modules
    if [ ! -d "node_modules" ]; then
        log_error "node_modules directory not found. Dependencies may not be installed."
        log_info "Try running setup.sh to install dependencies."
    else
        log_success "node_modules directory found."
    fi
    
    # 2. Check package.json
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. This is a critical file."
    else
        log_success "package.json found."
        
        # Check if vite is in devDependencies
        if grep -q '"vite"' package.json; then
            log_success "Vite is listed in package.json."
        else
            log_error "Vite not found in package.json. This is required for development."
        fi
        
        # Check for dev script
        if grep -q '"dev"' package.json; then
            log_success "dev script found in package.json."
        else
            log_error "dev script not found in package.json. This is required to start the development server."
        fi
    fi
    
    # 3. Check vite.config.js
    if [ ! -f "vite.config.js" ]; then
        log_error "vite.config.js not found. This file is required for Vite configuration."
    else
        log_success "vite.config.js found."
    fi
    
    # 4. Check for port conflicts
    log_info "Checking for port conflicts on 5173..."
    if lsof -i :5173 > /dev/null; then
        log_error "Port 5173 is already in use. This may prevent the development server from starting."
        log_info "Currently running on port 5173:"
        lsof -i :5173
    else
        log_success "Port 5173 is available."
    fi
    
    # 5. Check disk space
    log_info "Checking disk space..."
    df -h . | grep -v Filesystem
    
    # 6. Check for .env file
    if [ -f ".env" ]; then
        log_success ".env file found."
    else
        log_warning ".env file not found. This may be required for environment variables."
    fi
    
    # 7. Run dependency check
    log_info "Running dependency check..."
    PM=$(get_package_manager ".")
    case "$PM" in
        pnpm)
            pnpm exec vite --version || log_error "Vite executable not found through pnpm."
            ;;
        yarn)
            yarn vite --version || log_error "Vite executable not found through yarn."
            ;;
        npm)
            npx vite --version || log_error "Vite executable not found through npm."
            ;;
    esac
    
    log_info "Diagnostics complete. Check the logs above for any issues."
}

# Main function
main() {
    diagnose_frontend
}

# Run main function with all arguments
main "$@" 