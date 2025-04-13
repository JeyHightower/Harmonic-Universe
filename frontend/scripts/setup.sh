#!/bin/bash

# ======================================
# Harmonic Universe - Frontend Setup
# ======================================
#
# This script sets up the frontend environment.

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROOT_DIR")"

# Source core utilities
source "$PROJECT_ROOT/scripts-new/core.sh"
source "$PROJECT_ROOT/scripts-new/utils.sh"

# Welcome message
print_banner
log_info "Setting up Harmonic Universe Frontend..."

# Change to frontend directory
cd "$ROOT_DIR"

# Check for package.json
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Are you in the frontend directory?"
    exit 1
fi

# Install dependencies
log_info "Installing dependencies..."
PM=$(get_package_manager ".")

case "$PM" in
    pnpm)
        execute_command "pnpm install" "Installing frontend dependencies with pnpm"
        ;;
    yarn)
        execute_command "yarn install" "Installing frontend dependencies with yarn"
        ;;
    npm)
        execute_command "npm install" "Installing frontend dependencies with npm"
        ;;
    *)
        log_error "Unknown package manager: $PM"
        exit 1
        ;;
esac

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    log_info "Creating .env.local file..."
    cat > .env.local << EOF
# Frontend environment variables
VITE_API_URL=http://localhost:5001/api
EOF
    log_success ".env.local file created."
fi

log_success "Frontend setup completed successfully!"
log_info "You can start the development server with:"
log_info "  $PM run dev" 