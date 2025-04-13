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
if [ -f "$PROJECT_ROOT/scripts/core.sh" ]; then
    source "$PROJECT_ROOT/scripts/core.sh"
    source "$PROJECT_ROOT/scripts/utils.sh"
else
    # Define minimal required functions if core scripts aren't available
    print_banner() {
        echo "===================================="
        echo "   Harmonic Universe Frontend Build"
        echo "===================================="
    }
    
    log_info() {
        echo "[INFO] $1"
    }
    
    log_success() {
        echo "[SUCCESS] $1"
    }
    
    log_error() {
        echo "[ERROR] $1"
    }
    
    execute_command() {
        local cmd="$1"
        local description="${2:-Running command}"
        
        log_info "$description: $cmd"
        eval "$cmd"
        return $?
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
fi

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

# Run core build script (which handles everything)
log_info "Running build process..."

# Check if we should patch Rollup native modules (needed for some environments)
PATCH_ROLLUP=""
if [ "$1" == "--patch-rollup" ]; then
    log_info "Will patch Rollup native modules"
    PATCH_ROLLUP="PATCH_ROLLUP=true"
fi

# Build command using the core build script
case "$PM" in
    pnpm)
        execute_command "$PATCH_ROLLUP pnpm exec node $SCRIPT_DIR/core/build.mjs" "Building frontend with pnpm"
        ;;
    yarn)
        execute_command "$PATCH_ROLLUP yarn node $SCRIPT_DIR/core/build.mjs" "Building frontend with yarn"
        ;;
    npm)
        execute_command "$PATCH_ROLLUP npx node $SCRIPT_DIR/core/build.mjs" "Building frontend with npm"
        ;;
    *)
        log_error "Unknown package manager: $PM"
        exit 1
        ;;
esac

# Verify build
if [ -d "dist" ]; then
    log_success "Frontend built successfully in the dist directory."
    
    # Count assets
    ASSET_COUNT=$(find dist -type f | wc -l)
    log_info "Build contains $ASSET_COUNT files."
    
    # Check index.html
    if [ -f "dist/index.html" ]; then
        log_success "index.html is present in the build."
    else
        log_error "index.html is missing from the build!"
    fi
else
    log_error "Build failed. No dist directory found."
    exit 1
fi 