#!/bin/bash

# ======================================
# Harmonic Universe - Frontend Development
# ======================================
#
# This script starts the frontend development server.

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_ROOT="$(dirname "$SCRIPTS_ROOT")"

# Helper functions
print_banner() {
    echo "========================================"
    echo "   Harmonic Universe Frontend Dev Server"
    echo "========================================"
}

log_info() {
    echo "[INFO] $1"
}

log_error() {
    echo "[ERROR] $1"
}

get_package_manager() {
    if [ -f "pnpm-lock.yaml" ]; then
        echo "pnpm"
    elif [ -f "yarn.lock" ]; then
        echo "yarn"
    else
        echo "npm"
    fi
}

# Welcome message
print_banner
log_info "Starting Harmonic Universe Frontend Development Server..."

# Change to frontend directory
cd "$FRONTEND_ROOT"

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