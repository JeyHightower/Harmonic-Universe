#!/bin/bash

# ======================================
# Harmonic Universe - Cleanup Script
# ======================================
#
# This script cleans up unnecessary files and directories in the Harmonic Universe project.

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Load core utilities
source "$SCRIPT_DIR/core.sh"

# Make script executable
chmod +x "$0"

# =====================
# Cleanup Functions
# =====================

# Clean build artifacts
clean_build() {
    log_info "Cleaning build artifacts..."
    
    # Clean frontend build artifacts
    log_info "Cleaning frontend build artifacts..."
    if [ -d "$ROOT_DIR/frontend/dist" ]; then
        log_info "Removing frontend/dist directory..."
        rm -rf "$ROOT_DIR/frontend/dist"
    fi
    
    if [ -d "$ROOT_DIR/frontend/build" ]; then
        log_info "Removing frontend/build directory..."
        rm -rf "$ROOT_DIR/frontend/build"
    fi
    
    # Clean backend build artifacts
    log_info "Cleaning backend build artifacts..."
    if [ -d "$ROOT_DIR/backend/__pycache__" ]; then
        log_info "Removing backend/__pycache__ directory..."
        rm -rf "$ROOT_DIR/backend/__pycache__"
    fi
    
    # Clean all __pycache__ directories
    find "$ROOT_DIR" -type d -name "__pycache__" -exec rm -rf {} +
    
    # Clean .pyc files
    find "$ROOT_DIR" -type f -name "*.pyc" -delete
    
    # Clean .coverage files
    find "$ROOT_DIR" -type f -name ".coverage" -delete
    
    # Clean .pytest_cache directories
    find "$ROOT_DIR" -type d -name ".pytest_cache" -exec rm -rf {} +
    
    # Clean distribution directory
    if [ -d "$ROOT_DIR/dist" ]; then
        log_info "Removing dist directory..."
        rm -rf "$ROOT_DIR/dist"
    fi
    
    log_success "Build artifacts cleaned!"
    return 0
}

# Clean dependencies
clean_dependencies() {
    log_info "Cleaning dependencies..."
    
    # Clean frontend dependencies
    log_info "Cleaning frontend dependencies..."
    if [ -d "$ROOT_DIR/frontend/node_modules" ]; then
        log_info "Removing frontend/node_modules directory..."
        rm -rf "$ROOT_DIR/frontend/node_modules"
    fi
    
    # Clean backend dependencies
    log_info "Cleaning backend dependencies..."
    if [ -d "$ROOT_DIR/backend/venv" ]; then
        log_info "Removing backend/venv directory..."
        rm -rf "$ROOT_DIR/backend/venv"
    fi
    
    # Clean root node_modules
    if [ -d "$ROOT_DIR/node_modules" ]; then
        log_info "Removing root node_modules directory..."
        rm -rf "$ROOT_DIR/node_modules"
    }
    
    log_success "Dependencies cleaned!"
    return 0
}

# Clean cache files
clean_cache() {
    log_info "Cleaning cache files..."
    
    # Clean npm cache
    if check_command "npm"; then
        log_info "Cleaning npm cache..."
        npm cache clean --force
    fi
    
    # Clean pnpm cache
    if check_command "pnpm"; then
        log_info "Cleaning pnpm cache..."
        pnpm store prune
    fi
    
    # Clean yarn cache
    if check_command "yarn"; then
        log_info "Cleaning yarn cache..."
        yarn cache clean
    fi
    
    # Clean Python cache
    find "$ROOT_DIR" -type d -name "__pycache__" -exec rm -rf {} +
    find "$ROOT_DIR" -type f -name "*.pyc" -delete
    
    # Clean .pytest_cache directories
    find "$ROOT_DIR" -type d -name ".pytest_cache" -exec rm -rf {} +
    
    # Clean .coverage files
    find "$ROOT_DIR" -type f -name ".coverage" -delete
    
    # Clean .DS_Store files
    find "$ROOT_DIR" -type f -name ".DS_Store" -delete
    
    log_success "Cache files cleaned!"
    return 0
}

# Clean temporary files
clean_temp() {
    log_info "Cleaning temporary files..."
    
    # Clean temporary files
    find "$ROOT_DIR" -type f -name "*.tmp" -delete
    find "$ROOT_DIR" -type f -name "*.log" -delete
    find "$ROOT_DIR" -type f -name "*.bak" -delete
    find "$ROOT_DIR" -type f -name "*~" -delete
    
    # Clean .DS_Store files
    find "$ROOT_DIR" -type f -name ".DS_Store" -delete
    
    log_success "Temporary files cleaned!"
    return 0
}

# =====================
# Main Function
# =====================

# Print usage
usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help       Show this help message and exit"
    echo "  -b, --build      Clean build artifacts only"
    echo "  -d, --deps       Clean dependencies only"
    echo "  -c, --cache      Clean cache files only"
    echo "  -t, --temp       Clean temporary files only"
    echo "  -a, --all        Clean everything (default)"
    echo "  -v, --verbose    Enable verbose output"
    echo "  -q, --quiet      Suppress output"
    echo ""
    echo "By default, all cleanup operations are performed."
}

# Parse command line arguments
parse_args() {
    CLEAN_BUILD=false
    CLEAN_DEPS=false
    CLEAN_CACHE=false
    CLEAN_TEMP=false
    CLEAN_ALL=true
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                usage
                exit 0
                ;;
            -b|--build)
                CLEAN_BUILD=true
                CLEAN_DEPS=false
                CLEAN_CACHE=false
                CLEAN_TEMP=false
                CLEAN_ALL=false
                shift
                ;;
            -d|--deps)
                CLEAN_BUILD=false
                CLEAN_DEPS=true
                CLEAN_CACHE=false
                CLEAN_TEMP=false
                CLEAN_ALL=false
                shift
                ;;
            -c|--cache)
                CLEAN_BUILD=false
                CLEAN_DEPS=false
                CLEAN_CACHE=true
                CLEAN_TEMP=false
                CLEAN_ALL=false
                shift
                ;;
            -t|--temp)
                CLEAN_BUILD=false
                CLEAN_DEPS=false
                CLEAN_CACHE=false
                CLEAN_TEMP=true
                CLEAN_ALL=false
                shift
                ;;
            -a|--all)
                CLEAN_ALL=true
                shift
                ;;
            -v|--verbose)
                CURRENT_LOG_LEVEL=$LOG_LEVEL_DEBUG
                shift
                ;;
            -q|--quiet)
                CURRENT_LOG_LEVEL=$LOG_LEVEL_ERROR
                shift
                ;;
            *)
                echo "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Main function
main() {
    print_banner
    log_info "Starting Harmonic Universe cleanup..."
    
    # Parse command line arguments
    parse_args "$@"
    
    # Execute cleanup operations
    if [ "$CLEAN_ALL" = true ]; then
        # Clean everything
        clean_build
        clean_dependencies
        clean_cache
        clean_temp
    else
        # Clean specific items
        if [ "$CLEAN_BUILD" = true ]; then
            clean_build
        fi
        
        if [ "$CLEAN_DEPS" = true ]; then
            clean_dependencies
        fi
        
        if [ "$CLEAN_CACHE" = true ]; then
            clean_cache
        fi
        
        if [ "$CLEAN_TEMP" = true ]; then
            clean_temp
        fi
    fi
    
    log_success "Cleanup completed successfully!"
    return 0
}

# Run main function
main "$@" 