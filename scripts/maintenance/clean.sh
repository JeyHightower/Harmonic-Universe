#!/bin/bash

# ======================================
# Harmonic Universe - Optimized Cleanup Script
# ======================================
#
# This script cleans up various artifacts in the Harmonic Universe project.
# Combined and optimized from clean.sh and cleanup.sh

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"
source "$SCRIPT_DIR/utils.sh"

# Get project root directory
ROOT_DIR=$(get_root_dir)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# =====================
# Cleanup Functions
# =====================

# Function to clean build artifacts
clean_build() {
    log_info "Cleaning build artifacts..."
    
    # Clean frontend build artifacts
    log_info "Cleaning frontend build..."
    if [ -d "$FRONTEND_DIR/dist" ]; then
        log_info "Removing frontend/dist directory..."
        rm -rf "$FRONTEND_DIR/dist"
    fi
    
    if [ -d "$FRONTEND_DIR/build" ]; then
        log_info "Removing frontend/build directory..."
        rm -rf "$FRONTEND_DIR/build"
    fi
    
    if [ -d "$FRONTEND_DIR/.cache" ]; then
        log_info "Removing frontend/.cache directory..."
        rm -rf "$FRONTEND_DIR/.cache"
    fi
    
    # Clean backend build artifacts
    log_info "Cleaning backend build..."
    if [ -d "$BACKEND_DIR/__pycache__" ]; then
        log_info "Removing backend/__pycache__ directory..."
        rm -rf "$BACKEND_DIR/__pycache__"
    fi
    
    # Clean all Python cache files
    find "$ROOT_DIR" -type d -name "__pycache__" -exec rm -rf {} \; 2>/dev/null || true
    find "$ROOT_DIR" -type f -name "*.pyc" -delete
    
    # Clean .coverage files
    find "$ROOT_DIR" -type f -name ".coverage" -delete
    
    # Clean .pytest_cache directories
    find "$ROOT_DIR" -type d -name ".pytest_cache" -exec rm -rf {} \; 2>/dev/null || true
    
    # Clean distribution directory
    if [ -d "$ROOT_DIR/dist" ]; then
        log_info "Removing dist directory..."
        rm -rf "$ROOT_DIR/dist"
    fi
    
    log_success "Build artifacts cleaned successfully."
    return 0
}

# Function to clean dependencies
clean_dependencies() {
    log_info "Cleaning dependencies..."
    
    # Clean frontend dependencies
    log_info "Cleaning frontend dependencies..."
    if [ -d "$FRONTEND_DIR/node_modules" ]; then
        log_info "Removing frontend/node_modules directory..."
        rm -rf "$FRONTEND_DIR/node_modules"
    fi
    
    # Clean backend dependencies
    log_info "Cleaning backend dependencies..."
    if [ -d "$BACKEND_DIR/venv" ]; then
        log_info "Removing backend/venv directory..."
        rm -rf "$BACKEND_DIR/venv"
    fi
    
    # Clean root dependencies
    log_info "Cleaning root dependencies..."
    if [ -d "$ROOT_DIR/node_modules" ]; then
        log_info "Removing root node_modules directory..."
        rm -rf "$ROOT_DIR/node_modules"
    fi
    
    log_success "Dependencies cleaned successfully."
    return 0
}

# Function to clean logs
clean_logs() {
    log_info "Cleaning logs..."
    
    # Clean backend logs
    log_info "Cleaning backend logs..."
    if [ -d "$BACKEND_DIR/logs" ]; then
        rm -rf "$BACKEND_DIR/logs/*.log"
    fi
    
    # Clean frontend logs
    log_info "Cleaning frontend logs..."
    if [ -d "$FRONTEND_DIR/logs" ]; then
        rm -rf "$FRONTEND_DIR/logs/*.log"
    fi
    
    # Clean root logs
    log_info "Cleaning root logs..."
    if [ -d "$ROOT_DIR/logs" ]; then
        rm -rf "$ROOT_DIR/logs/*.log"
    fi
    
    # Find and remove all log files
    find "$ROOT_DIR" -type f -name "*.log" -delete
    
    log_success "Logs cleaned successfully."
    return 0
}

# Function to clean temporary files
clean_temp() {
    log_info "Cleaning temporary files..."
    
    # Clean temporary files
    find "$ROOT_DIR" -type f -name "*.tmp" -delete
    find "$ROOT_DIR" -type f -name "*.temp" -delete
    find "$ROOT_DIR" -type f -name "*.swp" -delete
    find "$ROOT_DIR" -type f -name ".DS_Store" -delete
    find "$ROOT_DIR" -type f -name "*.bak" -delete
    find "$ROOT_DIR" -type f -name "*~" -delete
    
    # Clean temporary directories
    if [ -d "$ROOT_DIR/temp" ]; then
        rm -rf "$ROOT_DIR/temp"
    fi
    
    if [ -d "$ROOT_DIR/tmp" ]; then
        rm -rf "$ROOT_DIR/tmp"
    fi
    
    log_success "Temporary files cleaned successfully."
    return 0
}

# Function to clean deployments
clean_deployments() {
    log_info "Cleaning deployment artifacts..."
    
    # Clean deployment packages
    rm -f "$ROOT_DIR/deploy_package_*.tar.gz"
    
    # Clean old deployments
    if [ -d "$ROOT_DIR/deployments" ]; then
        log_info "Cleaning old deployments..."
        cd "$ROOT_DIR/deployments"
        
        # Keep the current and previous deployments
        current=$(readlink -f current 2>/dev/null)
        previous=$(readlink -f previous 2>/dev/null)
        
        # Remove old deployment directories
        for dir in deploy_*/; do
            if [ -d "$dir" ]; then
                dir_path=$(readlink -f "$dir")
                if [ "$dir_path" != "$current" ] && [ "$dir_path" != "$previous" ]; then
                    log_info "Removing old deployment: $dir"
                    rm -rf "$dir"
                fi
            fi
        done
    fi
    
    log_success "Deployment artifacts cleaned successfully."
    return 0
}

# Function to clean cache files
clean_cache() {
    log_info "Cleaning cache files..."
    
    # Clean npm cache
    if command -v npm &>/dev/null; then
        log_info "Cleaning npm cache..."
        npm cache clean --force
    fi
    
    # Clean pnpm cache
    if command -v pnpm &>/dev/null; then
        log_info "Cleaning pnpm cache..."
        pnpm store prune
    fi
    
    # Clean yarn cache
    if command -v yarn &>/dev/null; then
        log_info "Cleaning yarn cache..."
        yarn cache clean
    fi
    
    log_success "Cache files cleaned successfully."
    return 0
}

# Function to clean everything
clean_all() {
    log_info "Cleaning everything..."
    
    # Clean build artifacts
    clean_build
    
    # Clean dependencies
    clean_dependencies
    
    # Clean logs
    clean_logs
    
    # Clean temporary files
    clean_temp
    
    # Clean deployments
    clean_deployments
    
    # Clean cache
    clean_cache
    
    log_success "All artifacts cleaned successfully."
    return 0
}

# =====================
# Command Line Processing
# =====================

# Print usage
usage() {
    log_info "Harmonic Universe Cleanup Script"
    log_info "Usage: $0 [options] or $0 <command>"
    log_info ""
    log_info "Options:"
    log_info "  -h, --help       Show this help message and exit"
    log_info "  -b, --build      Clean build artifacts only"
    log_info "  -d, --deps       Clean dependencies only"
    log_info "  -l, --logs       Clean log files only"
    log_info "  -t, --temp       Clean temporary files only"
    log_info "  -p, --deploy     Clean deployment artifacts only"
    log_info "  -c, --cache      Clean cache files only"
    log_info "  -a, --all        Clean everything (default)"
    log_info "  -v, --verbose    Enable verbose output"
    log_info "  -q, --quiet      Suppress output"
    log_info ""
    log_info "Legacy Commands (for backward compatibility):"
    log_info "  build        Clean build artifacts"
    log_info "  deps         Clean dependencies"
    log_info "  logs         Clean log files"
    log_info "  temp         Clean temporary files"
    log_info "  deployments  Clean deployment artifacts"
    log_info "  cache        Clean cache files"
    log_info "  all          Clean everything"
    log_info "  help         Show this help message"
}

# Parse command line arguments
parse_args() {
    # Default to clean all if no options provided
    if [[ $# -eq 0 ]]; then
        clean_all
        exit 0
    fi
    
    # Check if using legacy command style (first argument without dash)
    if [[ $1 != -* ]]; then
        # Legacy command support
        case "$1" in
            build)
                clean_build
                ;;
            deps)
                clean_dependencies
                ;;
            logs)
                clean_logs
                ;;
            temp)
                clean_temp
                ;;
            deployments)
                clean_deployments
                ;;
            cache)
                clean_cache
                ;;
            all)
                clean_all
                ;;
            help)
                usage
                ;;
            *)
                log_error "Unknown command: $1"
                log_info "Use '$0 help' for usage information."
                exit 1
                ;;
        esac
        exit 0
    fi
    
    # Flag-based processing
    CLEAN_BUILD=false
    CLEAN_DEPS=false
    CLEAN_LOGS=false
    CLEAN_TEMP=false
    CLEAN_DEPLOY=false
    CLEAN_CACHE=false
    CLEAN_ALL=false
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                usage
                exit 0
                ;;
            -b|--build)
                CLEAN_BUILD=true
                shift
                ;;
            -d|--deps)
                CLEAN_DEPS=true
                shift
                ;;
            -l|--logs)
                CLEAN_LOGS=true
                shift
                ;;
            -t|--temp)
                CLEAN_TEMP=true
                shift
                ;;
            -p|--deploy)
                CLEAN_DEPLOY=true
                shift
                ;;
            -c|--cache)
                CLEAN_CACHE=true
                shift
                ;;
            -a|--all)
                CLEAN_ALL=true
                shift
                ;;
            -v|--verbose)
                set_log_level debug
                shift
                ;;
            -q|--quiet)
                set_log_level error
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    # If none of the specific options were selected, default to all
    if [[ "$CLEAN_BUILD" == "false" && "$CLEAN_DEPS" == "false" && 
          "$CLEAN_LOGS" == "false" && "$CLEAN_TEMP" == "false" && 
          "$CLEAN_DEPLOY" == "false" && "$CLEAN_CACHE" == "false" && 
          "$CLEAN_ALL" == "false" ]]; then
        CLEAN_ALL=true
    fi
    
    # Execute cleaning operations
    if [[ "$CLEAN_ALL" == "true" ]]; then
        clean_all
    else
        if [[ "$CLEAN_BUILD" == "true" ]]; then
            clean_build
        fi
        
        if [[ "$CLEAN_DEPS" == "true" ]]; then
            clean_dependencies
        fi
        
        if [[ "$CLEAN_LOGS" == "true" ]]; then
            clean_logs
        fi
        
        if [[ "$CLEAN_TEMP" == "true" ]]; then
            clean_temp
        fi
        
        if [[ "$CLEAN_DEPLOY" == "true" ]]; then
            clean_deployments
        fi
        
        if [[ "$CLEAN_CACHE" == "true" ]]; then
            clean_cache
        fi
    fi
}

# Main function
main() {
    print_banner
    
    # Process arguments
    parse_args "$@"
    
    return 0
}

# Run main function
main "$@" 