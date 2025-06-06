#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="system_cleanup_$(date +%Y%m%d_%H%M%S).log"
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

# Function to clean system caches
clean_system_caches() {
    log "Cleaning system caches..."

    # System caches
    sudo rm -rf /Library/Caches/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean system caches"

    # User caches
    rm -rf ~/Library/Caches/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean user caches"

    # Temporary files
    sudo rm -rf /private/var/folders/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean temporary files"
    sudo rm -rf /private/var/tmp/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean /private/var/tmp"

    # Log files
    sudo rm -rf /var/log/*.log 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean system logs"
    sudo rm -rf /var/log/asl/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean ASL logs"
}

# Function to clean user directories
clean_user_directories() {
    log "Cleaning user directories..."

    # Downloads folder (files older than 30 days)
    find ~/Downloads -type f -mtime +30 -delete 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean Downloads"

    # Empty trash
    rm -rf ~/.Trash/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to empty trash"

    # Clean Desktop (files older than 30 days)
    find ~/Desktop -type f -mtime +30 -delete 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean Desktop"
}

# Function to clean application caches
clean_application_caches() {
    log "Cleaning application caches..."

    # Browser caches
    rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Cache/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean Chrome cache"
    rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Code\ Cache/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean Chrome code cache"
    rm -rf ~/Library/Application\ Support/Google/Chrome/Default/GPUCache/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean Chrome GPU cache"

    # Safari caches
    rm -rf ~/Library/Caches/com.apple.Safari/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean Safari cache"

    # Xcode caches
    rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean Xcode derived data"
    rm -rf ~/Library/Developer/Xcode/iOS\ DeviceSupport/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean iOS device support"

    # Homebrew caches
    brew cleanup 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean Homebrew"
}

# Function to clean iOS backups
clean_ios_backups() {
    log "Cleaning iOS backups..."

    # Remove old iOS backups
    rm -rf ~/Library/Application\ Support/MobileSync/Backup/* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean iOS backups"
}

# Function to clean Time Machine snapshots
clean_time_machine() {
    log "Cleaning Time Machine snapshots..."

    # Remove local Time Machine snapshots
    sudo tmutil deletelocalsnapshots / 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean Time Machine snapshots"
}

# Function to clean development caches
clean_development_caches() {
    log "Cleaning development caches..."

    # Node.js
    npm cache clean --force 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean npm cache"
    pnpm store prune 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean pnpm store"

    # Python
    pip cache purge 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean pip cache"

    # Docker
    docker system prune -f 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean Docker system"

    # Git
    git gc --prune=now 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to run git gc"
}

# Function to find large files
find_large_files() {
    log "Finding large files (>100MB)..."

    # Find large files in home directory
    find ~ -type f -size +100M -exec ls -lh {} \; 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to find large files"
}

# Function to clean system logs
clean_system_logs() {
    log "Cleaning system logs..."

    # Clean system logs
    sudo rm -rf /var/log/*.log.* 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean rotated logs"
    sudo rm -rf /var/log/asl/*.asl 2>> "$LOG_DIR/$LOG_FILE" || log_warning "Failed to clean ASL logs"
}

# Main cleanup function
main_cleanup() {
    log "Starting system-wide cleanup process..."

    # Check disk space before cleanup
    check_disk_space

    # Run cleanup tasks
    clean_system_caches
    clean_user_directories
    clean_application_caches
    clean_ios_backups
    clean_time_machine
    clean_development_caches
    clean_system_logs

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
