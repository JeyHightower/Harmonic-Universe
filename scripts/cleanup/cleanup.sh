#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="cleanup_$(date +%Y%m%d_%H%M%S).log"
LOG_DIR="logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log messages
log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[$timestamp] $message${NC}"
    echo "[$timestamp] $message" >> "$LOG_DIR/$LOG_FILE"
}

# Function to log errors
log_error() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp] ERROR: $message${NC}"
    echo "[$timestamp] ERROR: $message" >> "$LOG_DIR/$LOG_FILE"
}

# Function to log warnings
log_warning() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[$timestamp] WARNING: $message${NC}"
    echo "[$timestamp] WARNING: $message" >> "$LOG_DIR/$LOG_FILE"
}

# Function to check disk space
check_disk_space() {
    log "Checking disk space..."
    df -h | tee -a "$LOG_DIR/$LOG_FILE"
}

# Function to clean npm and pnpm
clean_node() {
    log "Cleaning npm cache..."
    npm cache clean --force 2>> "$LOG_DIR/$LOG_FILE" || log_error "Failed to clean npm cache"

    log "Cleaning pnpm store..."
    pnpm store prune 2>> "$LOG_DIR/$LOG_FILE" || log_error "Failed to clean pnpm store"
}

# Function to clean pip
clean_pip() {
    log "Cleaning pip cache..."
    pip cache purge 2>> "$LOG_DIR/$LOG_FILE" || log_error "Failed to clean pip cache"
}

# Function to clean Docker
clean_docker() {
    log "Cleaning Docker system..."
    docker system prune -f 2>> "$LOG_DIR/$LOG_FILE" || log_error "Failed to clean Docker system"
}

# Function to clean git
clean_git() {
    log "Optimizing git repository..."
    git gc --prune=now 2>> "$LOG_DIR/$LOG_FILE" || log_error "Failed to run git gc"
    git reflog expire --expire=now --all 2>> "$LOG_DIR/$LOG_FILE" || log_error "Failed to expire git reflog"
}

# Function to clean system caches
clean_system() {
    log "Cleaning system caches..."
    sudo rm -rf /Library/Caches/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean system caches"
    rm -rf ~/Library/Caches/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean user caches"
    rm -rf /private/var/folders/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean temporary files"
}

# Function to find large files
find_large_files() {
    log "Finding large files (>100MB)..."
    find . -type f -size +100M -exec ls -lh {} \; 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to find large files"
}

# Main cleanup function
main_cleanup() {
    log "Starting cleanup process..."

    # Check disk space before cleanup
    check_disk_space

    # Run cleanup tasks
    clean_node
    clean_pip
    clean_docker
    clean_git
    clean_system

    # Find large files
    find_large_files

    # Check disk space after cleanup
    log "Cleanup completed. Final disk space:"
    check_disk_space

    log "Cleanup log saved to $LOG_DIR/$LOG_FILE"
}

# Parse command line arguments
DRY_RUN=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run cleanup
if [ "$DRY_RUN" = true ]; then
    log "Running in dry-run mode. No changes will be made."
    # Add dry-run logic here
else
    main_cleanup
fi
