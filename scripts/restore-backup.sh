#!/bin/bash

# ================================================================
# Restore from Backup Script
# ================================================================
# This script helps restore from a backup if the reorganization
# didn't work as expected.
# ================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║               HARMONIC UNIVERSE BACKUP RESTORER                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Project root directory
PROJECT_ROOT=$(pwd)

# Find available backups
find_backups() {
    echo "Available backups:"
    local counter=1

    find "$PROJECT_ROOT" -maxdepth 1 -type d -name "backup_*" | sort -r | while read -r backup_dir; do
        local backup_date=$(echo "$backup_dir" | sed -n "s/.*backup_\(.*\)/\1/p")
        echo "  $counter. $backup_dir ($(date -r "$backup_dir" '+%Y-%m-%d %H:%M:%S'))"
        counter=$((counter + 1))
    done
}

# Restore from backup
restore_backup() {
    local backup_dir=$1

    echo -e "${YELLOW}WARNING: This will replace your current codebase with the backup.${NC}"
    echo -e "${YELLOW}All changes made since the backup will be lost.${NC}"
    echo -n "Are you sure you want to proceed? (y/n): "
    read -r confirm

    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo "Restore canceled."
        return
    fi

    # Create a pre-restore backup just in case
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local pre_restore_backup="${PROJECT_ROOT}/pre_restore_${timestamp}"

    echo "Creating a pre-restore backup at: $pre_restore_backup"
    mkdir -p "$pre_restore_backup"

    # Exclude backups and node_modules from the pre-restore backup
    rsync -a --exclude="backup_*" --exclude="pre_restore_*" --exclude="node_modules" \
          --exclude=".git" "$PROJECT_ROOT/" "$pre_restore_backup/"

    echo "Pre-restore backup created."

    # Remove reorganized files (but keep backups)
    echo "Cleaning up reorganized files..."
    find "$PROJECT_ROOT" -maxdepth 1 -not -path "$PROJECT_ROOT" \
         -not -path "*/backup_*" -not -path "*/pre_restore_*" \
         -not -path "*/.git" | xargs rm -rf

    # Restore from the selected backup
    echo "Restoring from backup: $backup_dir"
    rsync -a --exclude="node_modules" "$backup_dir/" "$PROJECT_ROOT/"

    echo -e "${GREEN}Restore completed successfully!${NC}"
    echo "Your codebase has been restored from: $backup_dir"
    echo "A pre-restore backup was created at: $pre_restore_backup"
}

# Main execution
main() {
    echo "This script helps restore your codebase from a backup."

    find_backups

    echo ""
    echo -n "Enter the number of the backup to restore (or 0 to exit): "
    read -r choice

    if [ "$choice" -eq 0 ]; then
        echo "Exiting without restore."
        exit 0
    fi

    local backup_dir=$(find "$PROJECT_ROOT" -maxdepth 1 -type d -name "backup_*" | sort -r | sed -n "${choice}p")

    if [ -z "$backup_dir" ]; then
        echo -e "${RED}Invalid backup number.${NC}"
        exit 1
    fi

    restore_backup "$backup_dir"
}

# Run the main function
main

exit 0
