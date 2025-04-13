#!/bin/bash

# ======================================
# Harmonic Universe - Backend Database
# ======================================
#
# This script manages the backend database.

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROOT_DIR")"

# Source core utilities
source "$PROJECT_ROOT/scripts-new/core.sh"
source "$PROJECT_ROOT/scripts-new/utils.sh"

# Welcome message
print_banner
log_info "Harmonic Universe Backend Database Management..."

# Change to backend directory
cd "$ROOT_DIR"

# Check for virtual environment
if [ ! -d "venv" ]; then
    log_error "Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Activate virtual environment
log_info "Activating virtual environment..."
source venv/bin/activate

# Load environment variables
if [ -f ".env" ]; then
    log_info "Loading environment variables..."
    source .env
else
    log_warning ".env file not found. Using default environment variables."
fi

# Function to initialize database
init() {
    log_info "Initializing database..."
    init_database "${DB_NAME:-harmonic_universe}" "${DB_USER:-harmonic_user}" "${DB_PASSWORD:-harmonic_password}"
}

# Function to create migrations
migrate() {
    log_info "Creating database migrations..."
    flask db migrate -m "${1:-auto-migration}"
}

# Function to apply migrations
upgrade() {
    log_info "Applying database migrations..."
    flask db upgrade
}

# Function to reset database
reset() {
    log_info "Resetting database..."
    
    # Confirm reset
    if ! confirm "Are you sure you want to reset the database? All data will be lost."; then
        log_info "Database reset cancelled."
        return 0
    fi
    
    # Drop and recreate database
    log_info "Dropping and recreating database..."
    execute_command "psql -c \"DROP DATABASE IF EXISTS ${DB_NAME:-harmonic_universe};\" postgres" "Dropping database"
    execute_command "psql -c \"CREATE DATABASE ${DB_NAME:-harmonic_universe} OWNER ${DB_USER:-harmonic_user};\" postgres" "Creating database"
    
    # Apply migrations
    log_info "Applying migrations..."
    flask db upgrade
    
    # Seed database if seed script exists
    if [ -f "seed.py" ]; then
        log_info "Seeding database..."
        python seed.py
    else
        log_warning "Seed script not found. Skipping database seeding."
    fi
    
    log_success "Database reset successfully."
}

# Process command line arguments
command="${1:-help}"

case "$command" in
    init)
        init
        ;;
    migrate)
        migrate "$2"
        ;;
    upgrade)
        upgrade
        ;;
    reset)
        reset
        ;;
    help)
        log_info "Harmonic Universe Backend Database Management"
        log_info "Usage: $0 <command> [arg]"
        log_info ""
        log_info "Commands:"
        log_info "  init               Initialize database"
        log_info "  migrate [message]  Create database migrations"
        log_info "  upgrade            Apply database migrations"
        log_info "  reset              Reset database (drops and recreates)"
        log_info "  help               Show this help message"
        ;;
    *)
        log_error "Unknown command: $command"
        log_info "Use '$0 help' for usage information."
        exit 1
        ;;
esac 