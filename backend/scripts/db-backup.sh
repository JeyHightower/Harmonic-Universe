#!/bin/bash

# =========================================
# Harmonic Universe - Database Backup Utility
# =========================================
#
# This script handles database backup and restoration

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROOT_DIR")"

# Source core utilities
source "$PROJECT_ROOT/scripts/core.sh"
source "$PROJECT_ROOT/scripts/utils.sh"

# Welcome message
print_banner
log_info "Harmonic Universe Database Backup Utility"

# Constants
BACKUP_DIR="$PROJECT_ROOT/db-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create backup directory if it doesn't exist
ensure_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory at $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Function to backup database using pg_dump
backup_postgresql() {
    log_info "Backing up PostgreSQL database..."
    
    # Load database configuration from .env or .flaskenv
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
    elif [ -f "$PROJECT_ROOT/.flaskenv" ]; then
        source "$PROJECT_ROOT/.flaskenv"
    else
        log_error "No .env or .flaskenv file found. Cannot load database configuration."
        return 1
    fi
    
    # Extract database connection parameters
    DB_HOST=${DATABASE_HOST:-localhost}
    DB_PORT=${DATABASE_PORT:-5432}
    DB_NAME=${DATABASE_NAME:-harmonic_universe}
    DB_USER=${DATABASE_USER:-postgres}
    DB_PASSWORD=${DATABASE_PASSWORD:-postgres}
    
    # Create backup filename
    BACKUP_FILE="$BACKUP_DIR/postgresql-$DB_NAME-$TIMESTAMP.sql"
    
    # Perform backup with pg_dump
    log_info "Dumping database to $BACKUP_FILE..."
    
    # Set PGPASSWORD environment variable for pg_dump
    export PGPASSWORD="$DB_PASSWORD"
    
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p > "$BACKUP_FILE"
    
    # Check if backup was successful
    if [ $? -eq 0 ]; then
        log_success "Database backup completed successfully."
        log_info "Backup saved to: $BACKUP_FILE"
        
        # Create a compressed version
        log_info "Compressing backup file..."
        gzip -9 "$BACKUP_FILE"
        log_success "Compressed backup saved to: $BACKUP_FILE.gz"
        
        # Unset PGPASSWORD for security
        unset PGPASSWORD
        
        return 0
    else
        log_error "Database backup failed."
        
        # Unset PGPASSWORD for security
        unset PGPASSWORD
        
        return 1
    fi
}

# Function to backup SQLite database
backup_sqlite() {
    log_info "Backing up SQLite database..."
    
    # Find SQLite database file path
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
    elif [ -f "$PROJECT_ROOT/.flaskenv" ]; then
        source "$PROJECT_ROOT/.flaskenv"
    fi
    
    # Try to find the database path from environment variables
    if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == sqlite* ]]; then
        DB_PATH=$(echo "$DATABASE_URL" | sed -E 's/sqlite:\/\/\/(.*)/\1/')
    elif [ -n "$SQLALCHEMY_DATABASE_URI" ] && [[ "$SQLALCHEMY_DATABASE_URI" == sqlite* ]]; then
        DB_PATH=$(echo "$SQLALCHEMY_DATABASE_URI" | sed -E 's/sqlite:\/\/\/(.*)/\1/')
    else
        # Default to instance/database.db if not specified in environment
        DB_PATH="$ROOT_DIR/instance/database.db"
    fi
    
    # Check if database file exists
    if [ ! -f "$DB_PATH" ]; then
        log_error "SQLite database file not found at: $DB_PATH"
        return 1
    fi
    
    # Create backup filename
    BACKUP_FILE="$BACKUP_DIR/sqlite-$(basename "$DB_PATH")-$TIMESTAMP.db"
    
    # Copy the database file (SQLite is locked when in use, so we use .backup)
    log_info "Copying database to $BACKUP_FILE..."
    
    sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
    
    # Check if backup was successful
    if [ $? -eq 0 ]; then
        log_success "Database backup completed successfully."
        log_info "Backup saved to: $BACKUP_FILE"
        
        # Create a compressed version
        log_info "Compressing backup file..."
        gzip -9 "$BACKUP_FILE"
        log_success "Compressed backup saved to: $BACKUP_FILE.gz"
        
        return 0
    else
        log_error "Database backup failed."
        return 1
    fi
}

# Function to restore PostgreSQL database from backup
restore_postgresql() {
    log_info "Restoring PostgreSQL database from backup..."
    
    # Get backup file path
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        # List available backups
        log_info "Available PostgreSQL backups:"
        find "$BACKUP_DIR" -name "postgresql-*.sql*" | sort -r
        
        # Prompt for backup file path
        read -p "Enter backup file path: " backup_file
    fi
    
    # Check if backup file exists
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # If backup is compressed, uncompress it
    if [[ "$backup_file" == *.gz ]]; then
        log_info "Uncompressing backup file..."
        gunzip -k "$backup_file"
        backup_file="${backup_file%.gz}"
    fi
    
    # Load database configuration from .env or .flaskenv
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
    elif [ -f "$PROJECT_ROOT/.flaskenv" ]; then
        source "$PROJECT_ROOT/.flaskenv"
    else
        log_error "No .env or .flaskenv file found. Cannot load database configuration."
        return 1
    fi
    
    # Extract database connection parameters
    DB_HOST=${DATABASE_HOST:-localhost}
    DB_PORT=${DATABASE_PORT:-5432}
    DB_NAME=${DATABASE_NAME:-harmonic_universe}
    DB_USER=${DATABASE_USER:-postgres}
    DB_PASSWORD=${DATABASE_PASSWORD:-postgres}
    
    # Warning and confirmation
    log_warning "This will overwrite the existing database: $DB_NAME"
    read -p "Are you sure you want to proceed? (y/n): " confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_info "Restoration canceled."
        return 0
    fi
    
    # Set PGPASSWORD environment variable for psql
    export PGPASSWORD="$DB_PASSWORD"
    
    # Restore database
    log_info "Restoring database from backup..."
    
    # Drop and recreate database
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
    
    # Restore from backup
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$backup_file"
    
    # Check if restore was successful
    if [ $? -eq 0 ]; then
        log_success "Database restoration completed successfully."
        
        # Remove temporary uncompressed backup file if original was compressed
        if [[ "$1" == *.gz ]]; then
            rm "$backup_file"
        fi
        
        # Unset PGPASSWORD for security
        unset PGPASSWORD
        
        return 0
    else
        log_error "Database restoration failed."
        
        # Unset PGPASSWORD for security
        unset PGPASSWORD
        
        return 1
    fi
}

# Function to restore SQLite database from backup
restore_sqlite() {
    log_info "Restoring SQLite database from backup..."
    
    # Get backup file path
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        # List available backups
        log_info "Available SQLite backups:"
        find "$BACKUP_DIR" -name "sqlite-*.db*" | sort -r
        
        # Prompt for backup file path
        read -p "Enter backup file path: " backup_file
    fi
    
    # Check if backup file exists
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # If backup is compressed, uncompress it
    if [[ "$backup_file" == *.gz ]]; then
        log_info "Uncompressing backup file..."
        gunzip -k "$backup_file"
        backup_file="${backup_file%.gz}"
    fi
    
    # Find SQLite database file path
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
    elif [ -f "$PROJECT_ROOT/.flaskenv" ]; then
        source "$PROJECT_ROOT/.flaskenv"
    fi
    
    # Try to find the database path from environment variables
    if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == sqlite* ]]; then
        DB_PATH=$(echo "$DATABASE_URL" | sed -E 's/sqlite:\/\/\/(.*)/\1/')
    elif [ -n "$SQLALCHEMY_DATABASE_URI" ] && [[ "$SQLALCHEMY_DATABASE_URI" == sqlite* ]]; then
        DB_PATH=$(echo "$SQLALCHEMY_DATABASE_URI" | sed -E 's/sqlite:\/\/\/(.*)/\1/')
    else
        # Default to instance/database.db if not specified in environment
        DB_PATH="$ROOT_DIR/instance/database.db"
    fi
    
    # Warning and confirmation
    log_warning "This will overwrite the existing database at: $DB_PATH"
    read -p "Are you sure you want to proceed? (y/n): " confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_info "Restoration canceled."
        return 0
    fi
    
    # Ensure parent directory exists
    mkdir -p "$(dirname "$DB_PATH")"
    
    # Backup the existing database before overwriting
    if [ -f "$DB_PATH" ]; then
        log_info "Creating backup of current database before restoration..."
        cp "$DB_PATH" "$DB_PATH.pre-restore-$TIMESTAMP"
        log_success "Current database backed up to: $DB_PATH.pre-restore-$TIMESTAMP"
    fi
    
    # Copy the backup file to the database location
    log_info "Restoring database from backup..."
    cp "$backup_file" "$DB_PATH"
    
    # Check if restore was successful
    if [ $? -eq 0 ]; then
        log_success "Database restoration completed successfully."
        
        # Remove temporary uncompressed backup file if original was compressed
        if [[ "$1" == *.gz ]]; then
            rm "$backup_file"
        fi
        
        return 0
    else
        log_error "Database restoration failed."
        
        # Try to restore the previous backup if it exists
        if [ -f "$DB_PATH.pre-restore-$TIMESTAMP" ]; then
            log_warning "Attempting to restore previous database state..."
            cp "$DB_PATH.pre-restore-$TIMESTAMP" "$DB_PATH"
            if [ $? -eq 0 ]; then
                log_success "Reverted to previous database state."
            else
                log_error "Failed to revert to previous database state."
            fi
        fi
        
        return 1
    fi
}

# Function to list all backups
list_backups() {
    log_info "Available database backups:"
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        log_warning "No backups found."
        return 0
    fi
    
    # Find and display all backup files
    find "$BACKUP_DIR" -type f -name "*.sql*" -o -name "*.db*" | sort -r | while read -r backup; do
        size=$(du -h "$backup" | cut -f1)
        date=$(date -r "$backup" "+%Y-%m-%d %H:%M:%S")
        echo "$(basename "$backup") ($size) - $date"
    done
}

# Function to clean up old backups
cleanup_backups() {
    log_info "Cleaning up old database backups..."
    
    # Get days to keep
    local days_to_keep="$1"
    
    if [ -z "$days_to_keep" ]; then
        # Default to 30 days
        days_to_keep=30
    fi
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        log_warning "No backup directory exists at: $BACKUP_DIR"
        return 0
    fi
    
    # Find backups older than specified days
    log_info "Finding backups older than $days_to_keep days..."
    old_backups=$(find "$BACKUP_DIR" -type f -name "*.sql*" -o -name "*.db*" -mtime +$days_to_keep)
    
    if [ -z "$old_backups" ]; then
        log_info "No old backups found."
        return 0
    fi
    
    # Display and confirm deletion
    echo "The following backups will be deleted:"
    echo "$old_backups"
    read -p "Are you sure you want to delete these backups? (y/n): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        # Delete old backups
        find "$BACKUP_DIR" -type f \( -name "*.sql*" -o -name "*.db*" \) -mtime +$days_to_keep -delete
        log_success "Old backups deleted."
    else
        log_info "Cleanup canceled."
    fi
}

# Main function
main() {
    # Ensure backup directory exists
    ensure_backup_dir
    
    if [ $# -eq 0 ]; then
        # Show help if no arguments provided
        log_info "Usage: $0 [backup|restore|list|cleanup days]"
        log_info "  backup   - Create a new database backup"
        log_info "  restore  - Restore database from a backup"
        log_info "  list     - List available backups"
        log_info "  cleanup  - Remove backups older than specified days (default: 30)"
        exit 0
    fi
    
    # Process arguments
    case "$1" in
        backup)
            # Determine database type
            if [ -f "$PROJECT_ROOT/.env" ]; then
                source "$PROJECT_ROOT/.env"
            elif [ -f "$PROJECT_ROOT/.flaskenv" ]; then
                source "$PROJECT_ROOT/.flaskenv"
            fi
            
            # Check if PostgreSQL or SQLite
            if [ -n "$DATABASE_URL" ]; then
                if [[ "$DATABASE_URL" == postgres* ]]; then
                    backup_postgresql
                elif [[ "$DATABASE_URL" == sqlite* ]]; then
                    backup_sqlite
                else
                    log_error "Unsupported database type in DATABASE_URL: $DATABASE_URL"
                    log_info "Currently only PostgreSQL and SQLite are supported for backups."
                    exit 1
                fi
            elif [ -n "$SQLALCHEMY_DATABASE_URI" ]; then
                if [[ "$SQLALCHEMY_DATABASE_URI" == postgres* ]]; then
                    backup_postgresql
                elif [[ "$SQLALCHEMY_DATABASE_URI" == sqlite* ]]; then
                    backup_sqlite
                else
                    log_error "Unsupported database type in SQLALCHEMY_DATABASE_URI: $SQLALCHEMY_DATABASE_URI"
                    log_info "Currently only PostgreSQL and SQLite are supported for backups."
                    exit 1
                fi
            else
                # Default to SQLite if no database URI is found
                log_warning "No database URI found, defaulting to SQLite."
                backup_sqlite
            fi
            ;;
        restore)
            # Determine database type
            if [ -f "$PROJECT_ROOT/.env" ]; then
                source "$PROJECT_ROOT/.env"
            elif [ -f "$PROJECT_ROOT/.flaskenv" ]; then
                source "$PROJECT_ROOT/.flaskenv"
            fi
            
            # Check if PostgreSQL or SQLite
            if [ -n "$DATABASE_URL" ]; then
                if [[ "$DATABASE_URL" == postgres* ]]; then
                    restore_postgresql "$2"
                elif [[ "$DATABASE_URL" == sqlite* ]]; then
                    restore_sqlite "$2"
                else
                    log_error "Unsupported database type in DATABASE_URL: $DATABASE_URL"
                    log_info "Currently only PostgreSQL and SQLite are supported for restoration."
                    exit 1
                fi
            elif [ -n "$SQLALCHEMY_DATABASE_URI" ]; then
                if [[ "$SQLALCHEMY_DATABASE_URI" == postgres* ]]; then
                    restore_postgresql "$2"
                elif [[ "$SQLALCHEMY_DATABASE_URI" == sqlite* ]]; then
                    restore_sqlite "$2"
                else
                    log_error "Unsupported database type in SQLALCHEMY_DATABASE_URI: $SQLALCHEMY_DATABASE_URI"
                    log_info "Currently only PostgreSQL and SQLite are supported for restoration."
                    exit 1
                fi
            else
                # Default to SQLite if no database URI is found
                log_warning "No database URI found, defaulting to SQLite."
                restore_sqlite "$2"
            fi
            ;;
        list)
            list_backups
            ;;
        cleanup)
            cleanup_backups "$2"
            ;;
        *)
            log_error "Unknown command: $1"
            log_info "Usage: $0 [backup|restore|list|cleanup days]"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 