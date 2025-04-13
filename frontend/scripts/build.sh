#!/bin/bash

# ======================================
# Harmonic Universe - Frontend Build
# ======================================
#
# This script builds the frontend for production.

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROOT_DIR")"

# Source core utilities
source "$PROJECT_ROOT/scripts-new/core.sh"
source "$PROJECT_ROOT/scripts-new/utils.sh"

# Welcome message
print_banner
log_info "Building Harmonic Universe Frontend..."

# Change to frontend directory
cd "$ROOT_DIR"

# Check for package.json
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Are you in the frontend directory?"
    exit 1
fi

# Get package manager
PM=$(get_package_manager ".")

# Build for production
log_info "Building for production..."
case "$PM" in
    pnpm)
        execute_command "pnpm run build" "Building frontend with pnpm"
        ;;
    yarn)
        execute_command "yarn build" "Building frontend with yarn"
        ;;
    npm)
        execute_command "npm run build" "Building frontend with npm"
        ;;
    *)
        log_error "Unknown package manager: $PM"
        exit 1
        ;;
esac

# Verify build
if [ -d "dist" ]; then
    log_success "Frontend built successfully in the dist directory."
elif [ -d "build" ]; then
    log_success "Frontend built successfully in the build directory."
else
    log_error "Build failed. No dist or build directory found."
    exit 1
fi 