#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CLEANUP_SCRIPT="$SCRIPT_DIR/cleanup.sh"

# Function to check if script exists
check_script() {
    if [ ! -f "$CLEANUP_SCRIPT" ]; then
        echo -e "${RED}Error: Cleanup script not found at $CLEANUP_SCRIPT${NC}"
        exit 1
    fi
}

# Function to make script executable
make_executable() {
    chmod +x "$CLEANUP_SCRIPT"
}

# Function to create weekly cron job
create_weekly_cron() {
    # Create a temporary file for the crontab
    TMP_CRON=$(mktemp)

    # Export current crontab
    crontab -l > "$TMP_CRON" 2>/dev/null || echo "" > "$TMP_CRON"

    # Add weekly cleanup job (runs every Sunday at 2 AM)
    echo "0 2 * * 0 $CLEANUP_SCRIPT" >> "$TMP_CRON"

    # Install new crontab
    crontab "$TMP_CRON"

    # Remove temporary file
    rm "$TMP_CRON"

    echo -e "${GREEN}Weekly cleanup scheduled for every Sunday at 2 AM${NC}"
}

# Function to create monthly cron job
create_monthly_cron() {
    # Create a temporary file for the crontab
    TMP_CRON=$(mktemp)

    # Export current crontab
    crontab -l > "$TMP_CRON" 2>/dev/null || echo "" > "$TMP_CRON"

    # Add monthly cleanup job (runs on the 1st of every month at 3 AM)
    echo "0 3 1 * * $CLEANUP_SCRIPT" >> "$TMP_CRON"

    # Install new crontab
    crontab "$TMP_CRON"

    # Remove temporary file
    rm "$TMP_CRON"

    echo -e "${GREEN}Monthly cleanup scheduled for the 1st of every month at 3 AM${NC}"
}

# Function to show current schedule
show_schedule() {
    echo -e "${YELLOW}Current scheduled cleanup jobs:${NC}"
    crontab -l
}

# Main function
main() {
    check_script
    make_executable

    case "$1" in
        "weekly")
            create_weekly_cron
            ;;
        "monthly")
            create_monthly_cron
            ;;
        "show")
            show_schedule
            ;;
        *)
            echo -e "${RED}Usage: $0 [weekly|monthly|show]${NC}"
            echo "  weekly  - Schedule weekly cleanup (Sunday 2 AM)"
            echo "  monthly - Schedule monthly cleanup (1st of month 3 AM)"
            echo "  show    - Show current schedule"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
