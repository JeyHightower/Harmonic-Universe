#!/bin/bash

# ======================================
# Harmonic Universe - Frontend Development
# ======================================
#
# This script starts the frontend development server.

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROOT_DIR")"

# Source core utilities
source "$PROJECT_ROOT/scripts-new/core.sh"
source "$PROJECT_ROOT/scripts-new/utils.sh"

# Welcome message
print_banner
log_info "Starting Harmonic Universe Frontend Development Server..."

# Change to frontend directory
cd "$ROOT_DIR"

# Check for package.json
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Are you in the frontend directory?"
    exit 1
fi

# Get package manager
PM=$(get_package_manager ".")

# Start development server
log_info "Starting development server..."
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
        exit 1
        ;;
esac 