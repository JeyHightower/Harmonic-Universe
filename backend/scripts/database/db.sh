#!/bin/bash

# ======================================
# Harmonic Universe - Database Management
# ======================================
#
# This script manages database operations for the Harmonic Universe project.

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"
source "$SCRIPT_DIR/utils.sh"

# Get project root directory
ROOT_DIR=$(get_root_dir)
BACKEND_DIR="$ROOT_DIR/backend"

# Function to initialize database
init_db() {
    log_info "Initializing database..."
    
    # Get database credentials
    if [ -f "$BACKEND_DIR/.env" ]; then
        source "$BACKEND_DIR/.env"
        log_info "Using database credentials from .env file."
    else
        log_warning ".env file not found. Using default credentials."
    fi
    
    # Initialize database
    init_database "${DB_NAME:-harmonic_universe}" "${DB_USER:-harmonic_user}" "${DB_PASSWORD:-harmonic_password}"
}

# Function to create database migrations
create_migrations() {
    log_info "Creating database migrations..."
    
    # Change to backend directory
    cd "$BACKEND_DIR"
    
    # Activate virtual environment using pyenv
    if command -v pyenv &> /dev/null; then
        eval "$(pyenv init -)"
        eval "$(pyenv virtualenv-init -)"
        pyenv activate myenv || log_error "Failed to activate myenv, falling back to pyenv shell"
        pyenv shell myenv
    elif [ -d "myenv" ]; then
        source myenv/bin/activate
    else
        log_error "Virtual environment not found. Please ensure myenv is created with pyenv."
        return 1
    fi
    
    # Create migrations
    log_info "Creating migrations..."
    python -m flask db migrate -m "${1:-auto-migration}"
    
    log_success "Migrations created successfully."
}

# Function to apply database migrations
apply_migrations() {
    log_info "Applying database migrations..."
    
    # Change to backend directory
    cd "$BACKEND_DIR"
    
    # Activate virtual environment using pyenv
    if command -v pyenv &> /dev/null; then
        eval "$(pyenv init -)"
        eval "$(pyenv virtualenv-init -)"
        pyenv activate myenv || log_error "Failed to activate myenv, falling back to pyenv shell"
        pyenv shell myenv
    elif [ -d "myenv" ]; then
        source myenv/bin/activate
    else
        log_error "Virtual environment not found. Please ensure myenv is created with pyenv."
        return 1
    fi
    
    # Apply migrations
    log_info "Applying migrations..."
    python -m flask db upgrade
    
    log_success "Migrations applied successfully."
}

# Function to reset database
reset_db() {
    log_info "Resetting database..."
    
    # Change to backend directory
    cd "$BACKEND_DIR"
    
    # Activate virtual environment using pyenv
    if command -v pyenv &> /dev/null; then
        eval "$(pyenv init -)"
        eval "$(pyenv virtualenv-init -)"
        pyenv activate myenv || log_error "Failed to activate myenv, falling back to pyenv shell"
        pyenv shell myenv
    elif [ -d "myenv" ]; then
        source myenv/bin/activate
    else
        log_error "Virtual environment not found. Please ensure myenv is created with pyenv."
        return 1
    fi
    
    # Get database credentials
    if [ -f ".env" ]; then
        source ".env"
        log_info "Using database credentials from .env file."
    else
        log_warning ".env file not found. Using default credentials."
    fi
    
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
    python -m flask db upgrade
    
    # Seed database if seed script exists
    if [ -f "seed.py" ]; then
        log_info "Seeding database..."
        python seed.py
    else
        log_warning "Seed script not found. Skipping database seeding."
    fi
    
    log_success "Database reset successfully."
}

# Function to create a database backup
backup_db() {
    log_info "Creating database backup..."
    
    # Get database credentials
    if [ -f "$BACKEND_DIR/.env" ]; then
        source "$BACKEND_DIR/.env"
        log_info "Using database credentials from .env file."
    else
        log_warning ".env file not found. Using default credentials."
    fi
    
    # Create backup directory
    local backup_dir="$ROOT_DIR/data/backups"
    ensure_directory "$backup_dir"
    
    # Create backup
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$backup_dir/${DB_NAME:-harmonic_universe}_$timestamp.sql"
    
    log_info "Creating backup: $backup_file"
    execute_command "pg_dump -U ${DB_USER:-harmonic_user} ${DB_NAME:-harmonic_universe} > $backup_file" "Backing up database"
    
    log_success "Database backup created: $backup_file"
}

# Function to restore a database backup
restore_db() {
    log_info "Restoring database backup..."
    
    # Get database credentials
    if [ -f "$BACKEND_DIR/.env" ]; then
        source "$BACKEND_DIR/.env"
        log_info "Using database credentials from .env file."
    else
        log_warning ".env file not found. Using default credentials."
    fi
    
    # Check backup file
    local backup_file="$1"
    if [ -z "$backup_file" ]; then
        log_error "No backup file specified."
        log_info "Usage: $0 restore <backup_file>"
        return 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Confirm restore
    if ! confirm "Are you sure you want to restore the database from $backup_file? Current data will be lost."; then
        log_info "Database restore cancelled."
        return 0
    fi
    
    # Drop and recreate database
    log_info "Dropping and recreating database..."
    execute_command "psql -c \"DROP DATABASE IF EXISTS ${DB_NAME:-harmonic_universe};\" postgres" "Dropping database"
    execute_command "psql -c \"CREATE DATABASE ${DB_NAME:-harmonic_universe} OWNER ${DB_USER:-harmonic_user};\" postgres" "Creating database"
    
    # Restore backup
    log_info "Restoring backup..."
    execute_command "psql -U ${DB_USER:-harmonic_user} -d ${DB_NAME:-harmonic_universe} < $backup_file" "Restoring database"
    
    log_success "Database restored successfully."
}

# Main function
main() {
    print_banner
    
    # Process command line arguments
    local command="${1:-help}"
    local arg="$2"
    
    case "$command" in
        init)
            init_db
            ;;
        migrate)
            create_migrations "$arg"
            ;;
        upgrade)
            apply_migrations
            ;;
        reset)
            reset_db
            ;;
        backup)
            backup_db
            ;;
        restore)
            restore_db "$arg"
            ;;
        help)
            log_info "Harmonic Universe Database Management"
            log_info "Usage: $0 <command> [arg]"
            log_info ""
            log_info "Commands:"
            log_info "  init               Initialize database"
            log_info "  migrate [message]  Create database migrations"
            log_info "  upgrade            Apply database migrations"
            log_info "  reset              Reset database (drops and recreates)"
            log_info "  backup             Create database backup"
            log_info "  restore <file>     Restore database from backup"
            log_info "  help               Show this help message"
            ;;
        *)
            log_error "Unknown command: $command"
            log_info "Use '$0 help' for usage information."
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 